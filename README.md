# cocotrace
A QR-Code based web app to help students log their seating in university classrooms to facilitate COVID contact tracing
<img src="https://user-images.githubusercontent.com/6568972/139866879-453316a1-31d3-45bb-89e6-4c179c992f3f.png" width="20%" height="20%"> <img src="https://user-images.githubusercontent.com/6568972/139865410-23667add-6a9a-483e-a342-00664a729cd0.png" width="20%" height="20%">

In September 2021, the Hellenic Government re-opened universities for in-person teaching, under certain restrictions (access to vaccinated or PCR-tested persons, or to persons recovered from COVID within the last 6 months only). Classrooms were to be filled at 100% seating capacity. One problem with the given framework for re-opening universities is the difficulty of contact-tracing upon confirmed COVID cases, since classrooms can be very large (>300 persons) and of course notifying an entire cohort for the existence of a case can be quite ineffective.

As a response to the situation, I developed COCOTR@CE (COvid COntact TRacing @ CEid) to be used in the Computer Engineering and Informatics Department (CEID) at the University of Patras. COCOTR@CE is a simple web-app which allows students to scan QR-codes placed on every seat in a classroom, and therefore create a persistent record of their presence and seating position. If a student is confirmed as a COVID case, they can export the data and send it by email to a university authority, who can then announce the anonymised seating position log of that student to the entire department. Students can then check these logs against their own records and determine if they were in close proximity to the COVID case, therefore enabling them to make an informed decision on whether to pre-emptively get tested.

COCOTR@CE allows for the manual entry of seating records in case a QR code cannot be read (e.g. is missing, has been vandalised, or the student's camera can't pick it up). It requires a smartphone with a modern browser (e.g. Chrome, Firefox, Safari). All data is safely stored on the students' own device and is not sent to a central server, making the application entirely private.

Alongside, I have developed a QR-code generator app (again, a simple web app), which can be handy for preparing the adhesive labels needed in each classroom. Usage details for both systems follow.

## Defining room structure in JSON
For both the QR-code generator and the COCOTR@CE app, you first need to define how your department's rooms are set up (rows and seats) using a simple JSON structure. The structure is an array of JSON objects, each object representing a room. Most rooms will have rows with an identical number of seats, with the exception of some rows and this can be modelled very easily as follows. 
The "standardRows" field is a nested JSON object where one defines the number of rows that contain identical setups (e.g. 10 rows of 5 seats each). The "exceptRows" field contains an array of JSON objects, and each of these objects describes a row number with an irregular setup. An example is shown below.

![Screenshot 2021-11-02 at 15 45 57](https://user-images.githubusercontent.com/6568972/139859391-c5797e45-0078-4720-a31d-107377aa2deb.png)

Here we see that the room has 11 rows of seats, with a corridor separating the rows. Row 2 has an irregular number of seats (12) whereas all other 10 rows have 14 seats each. To model this using the JSON structure described above, we can use the following simple syntax:

```javascript
{
      "roomName":"Β4",
      "standardRows":{
        "nrows":10,
        "nseats":14
      },
      "exceptRows":[
        {"rowid":2, "nseats":12}
      ]
}
```

## Generating QR codes
Upload the files in the `/generator` subdirectory to a web server and go to the `/generator/index.html` URL. Using the buttons, select a JSON file with the room structure from your local computer, and select the room for which you wish to generate the relevant QR codes. Once the QR-codes have been generated, you can print the webpage to have the output printed on sheets of pre-cut adhesive labels. 

![Screenshot 2021-11-02 at 16 18 46](https://user-images.githubusercontent.com/6568972/139865183-3c92aa6c-721d-42d0-b5f9-348d0b7acfb8.png)

Currently, the code is setup for printing on A4 sheets with 12 labels, sized 97x42.4mm each. You can change the CSS in the generator code to match the type of labels available to you, paying special attention to defining the label sizes, side and top/bottom margins and overall table dimensions in the CSS `@media print` section.

When ready to print, please ensure:
* print margins are set to NONE
* paper size is set to A4
* page zoom/shrink is set to 100%

It will be useful if you print some examples on plain A4 first by changing the `td` style definition to `outline: 1px dotted black`, so you can see the label edges and check that they align well with the actual cutouts on your label sheet.

## Using COCOTR@CE
First, edit the `/json/contactperson.json` file to provide the contact details of the departmental authorities responsible for handling the reporting of COVID cases. Then upload the files to a web server, and remember to include the room structure JSON you generated earlier in the `/json` subfolder. **To be able to use the camera to read QR codes, your web server must have an HTTPS certificate!** From there on, the application is pretty much self-explanatory to use.

Note that the application displays only the last 7 days of logged data so that the users do not get overloaded with information. The entire log is still kept in the device's storage though, until the user clears website data. This behaviour can be edited in the code.

### Sending seat logs to a departmental authority
The user simply selects a date from their log, and clicks on the Send to COVID Coordinator button. The application will generate an email containg the logs of the 7 days preceding that date, and the user can send it to the coordinators. The number of days for which to send logs can be edited in code.

# Legal and other notes
## Disclaimer
The software is provided “as is”, without warranty of any kind, express or implied, including but not limited to the fitness for a particular purpose. In no event shall the authors be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.

## License
The software is provided for use under the Apache 2.0 license. Please feel free to adapt and use for your own purposes. Credit to the original creator will be appreciated. **If you end up deploying COCOTR@CE (or a version based on it) at your department/university, kindly send me an email to let me know!**

## Credits
Made by Andreas Komninos at CEID, University of Patras, Greece. I couldn't have done it without
* The <a href="https://github.com/zxing-js/library">ZXing Typescript Library</a>
* <a href="https://davidshimjs.github.io/qrcodejs/">QRCode for Javascript</a> by Shangmin Shim
* The <a href="https://github.com/milligram/milligram">Milligram CSS framework</a>
* <a href="https://github.com/necolas/normalize.css">Normalize.css</a> CSS resets by Nicolas Gallagher
* Google's <a href="https://fonts.google.com/specimen/Roboto#standard-styles">Roboto fonts</a>


