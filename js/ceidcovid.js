//global variables
var dbName = "recordsDB"; //database name
var osName = "records";   //object store name
var db;                     //database object

var rooms=new Array();
var exportdate;
var sname;
var ssurname;
var sam;

var deferredPrompt;

//redirect if not https
if (window.location.protocol === 'http:') {
  link = window.location.href.replace('http://', 'https://');
  window.location.assign(link);
}

//Entry point for everything
window.addEventListener('load', function(evt){

  //register service serviceWorker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./sw.js');
  }
  else{
    console.log("No service worker in navigator");
  }

  // Get the modal
  var modal = document.getElementById("mailModal");

  // Get the <span> element that closes the modal
  var span = document.getElementById("closeModal");

  // When the user clicks on <span> (x), close the modal
  span.onclick = function() {
    modal.style.display = "none";
  };

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };

  //are we in PWA mode?
  /*if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    document.getElementById("install").style.display="none";
    console.log('display-mode is standalone');
  }*/

  var urlParams = new URLSearchParams(window.location.search);
  var myParam = urlParams.get('mode');
  console.log(myParam);
  if(myParam=="standalone")
  {
    document.getElementById("install").style.display="none";
    console.log('display-mode is standalone');
  }
  //Add pwa install event listeners

  window.addEventListener('beforeinstallprompt', function (e){
    e.preventDefault();
    deferredPrompt = e;
    console.log('beforeinstallprompt event was fired.');

  window.addEventListener('appinstalled', function(e){
    console.log('install event was fired.');
    document.getElementById("install").style.display="none";
  });
  //add install button listener
  document.getElementById("install").addEventListener('click', function(e){
    deferredPrompt.prompt();
    deferredPrompt = null;
    document.getElementById("install").style.display="none";
    });
  });

  //only for Chrome
  try{
    navigator.getInstalledRelatedApps().then(
      function(val){
          console.log(val);
          if(val.length>0)
          {
            document.getElementById("install").style.display="none";
          }
      },
      function(error){
        console.log(error);
      }
    );
  }
  catch (err)
  {
    //ios or firefox
    document.getElementById("install").style.display="none";
    console.log("getInstalledRelatedApps not supported");
  }

  checkDB();
  loadDevices();
});

async function purgeOldData()
{
  var lowdate = new Date("2021-01-01");
  var highdate = new Date();
  highdate = addDays(highdate, -30);
  var keyRangeValue = IDBKeyRange.bound(lowdate, highdate);
  await db.getAllFromIndex(osName, 'dateidx', keyRangeValue)
  .then(
    function(val){
      console.log("Deleted all before "+longDateToShort(highdate));
      console.log(val);
      loadRecords();
    },
    function (err){
      console.log("Could not delete all before "+longDateToShort(highdate));
      loadRecords();
    }
  );
}


function openModal(date){
  var modal = document.getElementById("mailModal");
  modal.style.display = "block";
  exportdate = date;
  document.getElementById("sname").value=localStorage.getItem("sname");
  document.getElementById("ssurname").value=localStorage.getItem("ssurname");
  document.getElementById("sam").value=localStorage.getItem("sam");
  document.getElementById("sendemail").addEventListener('click', fetchRecords);
  document.getElementById("dd").innerHTML=longDateToShort(new Date(exportdate));

}

function readFile() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      rjs=JSON.parse(this.responseText);
      for (var i=0;i<rjs.rooms.length;i++)
      {
        rooms.push(rjs.rooms[i].roomName);
      }
      roomsel = document.getElementById("roomsel");
      for (i=0;i<rooms.length; i++){
        opt = document.createElement("option");
        opt.text=rooms[i];
        opt.value=rooms[i];
        roomsel.appendChild(opt);
      }
    }
  };
  xhttp.open("GET", "json/rooms.json", true);
  xhttp.send();

}

//collapsible button function handler
var collHandler = function (evt) {
  evt.target.classList.toggle("active");
  var content = evt.target.nextElementSibling;
  if (content.style.maxHeight){
    content.style.maxHeight = null;
  } else {
    content.style.maxHeight = content.scrollHeight + "px";
  }
};

//calculate event listeners for collapsible buttons
function calcCollapsibles(){
  // generate event listeners for collapsible buttons
  var coll = document.getElementsByClassName("collapsible");

  //remove existing listeners
  for (var i = 0; i < coll.length; i++) {
    coll[i].removeEventListener("click", collHandler);
  }
  //add new listeners
  for (var j = 0; j < coll.length; j++) {
    coll[j].addEventListener("click", collHandler);
  }
}

//function to check database supported by browser
function checkDB() {
  dbOK = true;
  if("indexedDB" in window) {
      //console.log("YES, Browser support IndexedDB");
  }
  else if ( "webkitIndexedDB"  in window) {
      //console.log("YES, Browser support IndexedDB");
  }
  else  if ( "mozIndexedDB"  in window) {
      //console.log("YES, Browser support IndexedDB");
  }
  else {
      //console.log("No,Browser not support.");
      dbOK=false;
  }
  if (dbOK)
    setupDB().then(
      function(){
        purgeOldData();
        readFile();
        document.getElementById('savebtn').addEventListener('click', function(){
          record={
            date: new Date(),
            room:document.getElementById("roomsel").value,
            row:parseInt(document.getElementById("row").value),
            seat:parseInt(document.getElementById("seat").value)
          };
          if (document.getElementById("row").value== "" || document.getElementById("seat").value== "")
          {
            document.getElementById("manresult").innerHTML="Πρέπει να δώστε τιμές για τη σειρά/θέση";
          }
          else
          {
            writeRecord(record);
            document.getElementById("row").value="";
            document.getElementById("seat").value="";
            document.getElementById("manresult").innerHTML="Επιτυχής αποθήκευση.";
            loadRecords();
          }
        });
      }
    );
  else{
    document.getElementById("startButton").style.display = "none";
    document.getElementById("savebtnButton").style.display = "none";
    document.getElementById("result").innerHTML = "Sorry, your browser does not support this application (IndexedDB)";
  }
}

//function to create the database if not already present
async function setupDB(){
  db = await idb.openDB(dbName, undefined, {
    upgrade(db){
      //console.log('creating object store');
      // Create object store
      objectStore=db.createObjectStore(osName, {keyPath: "recid" , autoIncrement:true});
      // Create an index to search records by datetime.
      objectStore.createIndex("dateidx", "date", { unique: true });
      // Create an index to search records by room.
      objectStore.createIndex("roomidx", "room", { unique: false });
    }
  });
}

//function to add records to the database
async function writeRecord(record){
  await db.add(osName, record).then(
    function(recordid)
    {
      //console.log("Stored with recid"+recordid);
    }
  );
}

//function to load and display records from the database
async function loadRecords(){
  var currdate;

  var lowdate = new Date();
  var highdate = lowdate;
  lowdate = addDays(lowdate, -7);
  lowdate.setHours(0);
  lowdate.setMinutes(0);
  lowdate.setSeconds(0);
  lowdate.setMilliseconds(0);
  var keyRangeValue = IDBKeyRange.bound(lowdate, highdate);
  await db.getAllFromIndex(osName, 'dateidx', keyRangeValue)
  .then(
    function(rs){
      recdiv = document.getElementById("recordList");
      //console.log(rs);
      //clear webpage content
      while (recdiv.firstChild) {
          recdiv.removeChild(recdiv.firstChild);
      }

      var currtable;
      //loop to populate div with content from db
      for (i=0; i<rs.length; i++){
        var tempdate = longDateToShort(rs[i].date);
        if (currdate!=tempdate) //new date found
        {
          colbutton = document.createElement("button");
          colbutton.className="collapsible";
          colbutton.innerHTML=longDateToShort(rs[i].date);
          recdiv.appendChild(colbutton);
          content = document.createElement("div");
          content.className="content";
          currtable = document.createElement("table");
          currtable.setAttribute("id", rs[i].date);
          content.appendChild(currtable);
          recdiv.appendChild(content);
          currdate = tempdate;
          expbtn = document.createElement("button");
          expbtn.innerHTML="Αποστολη στον συντονιστη COVID";
          expbtn.setAttribute("onClick", "openModal(\""+rs[i].date+"\")");
          content.appendChild(expbtn);
        }
        var row = document.createElement("tr");
        var timecell = document.createElement("td");
        timecell.innerHTML = convertDate(rs[i].date);
        var roomcell = document.createElement("td");
        roomcell.innerHTML = rs[i].room+", Σειρά: "+rs[i].row+", Θέση: "+rs[i].seat;
        row.appendChild(timecell);
        row.appendChild(roomcell);
        currtable.appendChild(row);
    }
    calcCollapsibles();
  });
}

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function fetchRecords()
{
  document.getElementById("modalErrors").innerHTML="";
  if (document.getElementById("sname").value.length<1 ||
      document.getElementById("ssurname").value.length<1 ||
      document.getElementById("sam").value.length!=7) {
        document.getElementById("modalErrors").innerHTML="Παρακαλώ δώστε τα κατάλληλα στοιχεία";
      }
  else{
    document.getElementById("mailModal").style.display = "none";
    localStorage.setItem("sname", document.getElementById("sname").value);
    localStorage.setItem("ssurname", document.getElementById("ssurname").value);
    localStorage.setItem("sam", document.getElementById("sam").value);

    var lowdate = new Date(exportdate);
    var highdate = lowdate;
    lowdate = addDays(lowdate, -7);
    lowdate.setHours(0);
    lowdate.setMinutes(0);
    lowdate.setSeconds(0);
    lowdate.setMilliseconds(0);
    highdate.setHours(23);
    highdate.setMinutes(59);
    highdate.setSeconds(59);
    highdate.setMilliseconds(0);
    var keyRangeValue = IDBKeyRange.bound(lowdate, highdate);
    await db.getAllFromIndex(osName, 'dateidx', keyRangeValue).then(
      function(set){
        console.log(set);

        var bodytext ="Ημερολόγιο από "+longDateToShort(lowdate)+" εώς "+longDateToShort(highdate)+
                        " του/της: \n\n"+"Όνομα: "+localStorage.getItem("sname")+"\n"+
                        "Επώνυμο: "+localStorage.getItem("ssurname")+"\n"+
                        "AM: "+localStorage.getItem("sam") +"\n\n";

        for (i=0;i<set.length;i++){
          bodytext+="Ημερομηνία: "+convertDate(set[i].date)+", Αίθουσα: "+set[i].room+", Σειρά: "+set[i].row+", Θέση: "+set[i].seat+"\n";
        }

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
          if (this.readyState == 4 && this.status == 200) {
            rjs=JSON.parse(this.responseText);
            var mailto="";
            var cc=new Array();
            mailto=rjs.persons[0].email;
            for (var i=1;i<rjs.persons.length;i++)
            {
              cc.push(rjs.persons[i].email);
            }
            var link = "mailto:"+mailto
               + "?cc=" + cc.join(";")
               + "&subject=" + encodeURIComponent("COVID - Κρούσμα")
               + "&body=" + encodeURIComponent(bodytext+"\n\n"+JSON.stringify(set));
            window.open(link);
          }
        };
        xhttp.open("GET", "json/contactpersons.json", true);
        xhttp.send();


      }
    );
  }
}

//function to convert date objects to DD-MM-YYYY HH:MM format
function convertDate(d){
  var datestring = d.getDate()  + "-" + (d.getMonth()+1) + "-" + d.getFullYear() + " " +
    d.getHours() + ":" + (d.getMinutes()<10?'0':'') + d.getMinutes();
  return datestring;
}

//function to convert date objects to DD-MM-YYYY format
function longDateToShort(d)
{
  var datestring = d.getDate()  + "-" + (d.getMonth()+1) + "-" + d.getFullYear();
  return datestring;
}

//function to load device cameras and initiate qrcode reading
function loadDevices()
{
  var selectedDeviceId;
  var codeReader = new ZXing.BrowserQRCodeReader();
  console.log('ZXing code reader initialized');
  codeReader.listVideoInputDevices()
    .then(
      function(videoInputDevices){
        var sourceSelect =   document.getElementById('sourceSelect');
        //console.log(videoInputDevices);
        selectedDeviceId = videoInputDevices[0].deviceId;
        if (videoInputDevices.length >= 1) {
          for (i=0; i<videoInputDevices.length; i++)
          {
            console.log(videoInputDevices[i].deviceId);
            sourceOption = document.createElement('option');
            sourceOption.text = videoInputDevices[i].label;
            sourceOption.value = videoInputDevices[i].deviceId;
            sourceSelect.appendChild(sourceOption);
          }
        }
      },
      function(error)
      {
        console.log("error getting video devices");
      });

    sourceSelect.onchange = function(){
      selectedDeviceId = sourceSelect.value;
      codeReader.reset();
    };

    var sourceSelectPanel = document.getElementById('sourceSelectPanel');
    sourceSelectPanel.style.display = 'block';

    //start camera for qrcode reading
    document.getElementById('startButton').addEventListener('click', function(){
      videodiv = document.getElementById("videodiv");
      document.getElementById('result').textContent = '';

      codeReader.decodeFromInputVideoDevice(selectedDeviceId, 'video').then(
         function(result){
            resultJSON = JSON.parse(result.text);
            document.getElementById('result').textContent = "Αίθ.: "+resultJSON.room+
                                                            " Σειρά: "+resultJSON.row+
                                                            " Θέση: "+resultJSON.seat;
            presenceRecord = {
              date: new Date(),
              room:resultJSON.room,
              row:resultJSON.row,
              seat:resultJSON.seat
            };
            localStorage.records = JSON.stringify(presenceRecord);
            writeRecord(presenceRecord);
            codeReader.reset();
            videodiv.style.display = "inline";
            loadRecords();
      });
      console.log('Started decode from camera with id '+selectedDeviceId);

    });

    document.getElementById('stopButton').addEventListener('click', function(){
      codeReader.reset();
    });

  }
