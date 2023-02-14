var success = false;
while (!success) {
  try {
var formSheet = SpreadsheetApp.openById("[ID REMOVED]");
success = true;} catch {console.log(`Error ${e}, trying again...`);}}
const currency = Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
});
var email, employeeName, total,startTime, endTime;
var numErrors = 0;
var totalHrs = "";
var currentRow = "";
var error = "";
var errorMsg = "";
const today = new Date();
if (today.getDate() >= 8 && today.getMonth() != parseInt(PropertiesService.getScriptProperties().getProperty("currentMonth"))) {
  PropertiesService.getScriptProperties().setProperty("currentMonth", today.getMonth());
  PropertiesService.getScriptProperties().setProperty("sheetNumOfMonth", parseInt(PropertiesService.getScriptProperties().getProperty("sheetNumOfMonth")) + 1);
  console.log(`property "sheetNumOfMonth" was changed to ${PropertiesService.getScriptProperties().getProperty("sheetNumOfMonth")}`);  
}
var monthSheetNum = parseInt(PropertiesService.getScriptProperties().getProperty("sheetNumOfMonth"));
var latestEntry = [];
const defaultMsg = "<p>Thank you for submitting your subbing form. If the form was submitted correctly, please look for your subbing pay on the payroll that is sent on the 15th of the month. If you had questions that require a response, we will respond via email. Thanks again for your hard work and dedication to Bnos Yisroel.</p><br />";
const lateMsg = "<p>Thank you for submitting your subbing form. Your form has not been processed because it was submitted more than 30 (thirty) days after you subbed. If you would like to discuss this further, please speak to Mrs. Heyman. Thanks again for your hard work and dedication to Bnos Yisroel.</p>";

function manualSend() {
  var rowToSend = 180;
  currentRow = rowToSend;
  var sheetData = formSheet.getSheets()[0].getDataRange().getValues();
  for (var col = 0; col < 19; col++) {
      if (col == 16) {continue;}
      latestEntry.push(sheetData[rowToSend - 1][col]);
    }
  var e = {values: latestEntry};
  main(e);
}

function main(e) {
  // ScriptApp.newTrigger("main").forSpreadsheet(formSheet).onFormSubmit().create();
  latestEntry = e.values;
  for (var i in latestEntry) {
    console.log(`${i}: ${latestEntry[i]}`);
  }
  assignValues();
  var dateWorked = new Date(latestEntry[4]);
  if (dateWorked > today) {
    error = "Error - Date entered was in the future";
    sendEmail(`<p>There was an error with your form. The date you entered for when you worked (${dateWorked.toDateString()}) is in the future. Please fill out the form again: ${getLink()}<br />Thank you!</p>`);
    return;    
  }
  if (isEarlierThan30Days(dateWorked)) {
    error = "Error - Job was more than 30 days ago";
    sendEmail(lateMsg); 
    return;   
  }  
  if (error != "") {
    var begStr;
    numErrors == 1 ? begStr = "was 1 error" : begStr = `were ${numErrors} errors`;
    var html = `<p>There ${begStr} with your form: <br /><ol>${errorMsg}</ol>Please fill out the form again: ${getLink()}<br />Thank you!</p>`;
    sendEmail(html);
    return;
  }
  sendEmail(defaultMsg);
}

function assignValues() {
  var amountToMultiply, rate;
  employeeName = `${latestEntry[2]} ${latestEntry[1]}`;
  email = latestEntry[3];
  if (latestEntry[13] != "") {rate = latestEntry[13];}
  else {
  for (var i = 8; i < 12; i++) {
      if (latestEntry[i] != "") {rate = getRate(latestEntry[i]); break;}
    }
  }
  if (latestEntry[16] != "") {amountToMultiply = latestEntry[16]; totalHrs = "-----";}
  else {
    if (typeof latestEntry[14] == "object") {latestEntry[14] = getTimeStr(latestEntry[14]); latestEntry[15] = getTimeStr(latestEntry[15]); startTime = new Time(latestEntry[14]); endTime = new Time(latestEntry[15]);} //used for manuelSend
    else {startTime = new Time(latestEntry[14]); endTime = new Time(latestEntry[15]);}  //used with trigger
    console.log(`Beg: ${startTime}, end: ${endTime}`)
    if (startTime.getTime() > endTime.getTime()) {
    error += "Error - End time not later than start time\n";
    errorMsg += `<li>The end time (${endTime}) is not later than the start time (${startTime}).</li><br />`;
    numErrors++;
    }
    if (startTime.getTime() < 480 || startTime.getTime() > 1080) {
    error += "Error - Start time not between 8:00 AM and 6:00 PM\n";
    errorMsg += `<li>The start time (${startTime}) is not between 8:00 AM and 6:00 PM.</li><br />`;
    numErrors++;
    }
    if (endTime.getTime() < 480 || startTime.getTime() > 1080) {
    error += "Error - End time not between 8:00 AM and 6:00 PM\n";
    errorMsg += `<li>The end time (${endTime}) is not between 8:00 AM and 6:00 PM.</li><br />`;
    numErrors++;
    }
    if (error == "") {
      var totalMinutes = endTime.getTime() - startTime.getTime();
      amountToMultiply = totalMinutes / 60;
      totalMinutes % 60 == 0 ? totalHrs = `${amountToMultiply} hr` : totalHrs = `${Math.floor(totalMinutes / 60)} hr ${totalMinutes % 60} min`;
    }
  }
  total = rate * amountToMultiply;
  console.log(`${rate} x ${amountToMultiply} = ${currency.format(total)}`);
}

function logThisTotal() {
  var valueToEnter;
  error == "" ? valueToEnter = currency.format(total) : valueToEnter = error;
  if (currentRow == "") {currentRow = formSheet.getSheets()[0].getLastRow();}
  if (totalHrs == "") {totalHrs = "Encountered Error";}
  formSheet.getSheets()[0].getRange("Q" + currentRow).setValue(totalHrs);
  formSheet.getSheets()[0].getRange("T" + currentRow).setValue(valueToEnter);
  latestEntry[19] = valueToEnter;
  latestEntry[18] = latestEntry [17];
  latestEntry[17] = latestEntry[16];
  latestEntry[16] = totalHrs;
  const lastRow = formSheet.getSheets()[monthSheetNum].getLastRow() + 1;
  formSheet.getSheets()[monthSheetNum].getRange(`A${lastRow}:T${lastRow}`).setValues([latestEntry]);
}

function sendEmail(html) {      
  logThisTotal();
  var body = `<p>Regarding form submitted by: ${employeeName}</p>${html}`;
  var labels = formSheet.getSheets()[0].getDataRange().getValues();
  for (var col = 0; col < 20; col++) {
   console.log(`${col}: labels[0][col]: ${labels[0][col]}, latestEntry[col]: ${latestEntry[col]}`)
   if (col == 16 && totalHrs == "-----") {continue;}
   if (latestEntry[col] != "") {body += `${labels[0][col]}: ${latestEntry[col]}<br />`};
  }    
  GmailApp.sendEmail(email, "Bnos Yisroel Subbing", "", {
    name: "Bnos Yisroel",
    htmlBody: body,
    bcc: "[EMAIL REMOVED]"
    });
    console.log("Sent " + body);
    console.log(`Remaining emails: ${MailApp.getRemainingDailyQuota()}`);
}

function isEarlierThan30Days(dateToCalc) {
  const diffTime = Math.abs(today - dateToCalc);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) > 30;
}

function getRate(str) {
  return parseInt(str.substring(str.indexOf("$") + 1, str.indexOf(" per") - 1));
}

function getLink() {
  return `<a href="https://docs.google.com/forms/d/e/1FAIpQLSefTO-iJeXe-33ohW-lrkihwe99vVHQ--I_bWgzfeGuK6wMkw/viewform?usp=pp_url&entry.1635354735=${latestEntry[1].replaceAll(" ", "+")}&entry.735631664=${latestEntry[2].replaceAll(" ", "+")}&entry.1285744415=${latestEntry[3]}&entry.786767052=${latestEntry[4].getFormDate()}&entry.1631198218=${latestEntry[5].replaceAll(" ", "+")}&entry.1170655417=${latestEntry[6].replaceAll(" ", "+")}&entry.460683114=${latestEntry[7].replaceAll(" ", "+")}&entry.341974343=${latestEntry[8].replaceAll(" ", "+")}&entry.1633380961=${latestEntry[9].replaceAll(" ", "+")}&entry.81242712=${latestEntry[10].replaceAll(" ", "+")}&entry.1558906679=${latestEntry[11].replaceAll(" ", "+")}&entry.2122076207=${latestEntry[12].replaceAll(" ", "+")}&entry.1056990=${latestEntry[13]}&entry.1342390818=${latestEntry[14].getFormTime()}&entry.854175140=${latestEntry[15].getFormTime()}&entry.1190630938=${latestEntry[16]}&entry.1174631666=${latestEntry[17].replaceAll(" ", "+")}">https://docs.google.com/forms/d/e/1FAIpQLSefTO-iJeXe-33ohW-lrkihwe99vVHQ--I_bWgzfeGuK6wMkw/viewform</a>`;
}

function getTimeStr(dateObj) {
  var hours = dateObj.getHours();
  var amOrPm = hours >= 12 ? 'PM' : 'AM';
  hours % 12 == 0 ? hours = 12 : hours = Time.addLeadingZeroIfNone(hours % 12);
  console.log(`${hours}:${Time.addLeadingZeroIfNone(dateObj.getMinutes())}:00 ${amOrPm}`)
  return `${hours}:${Time.addLeadingZeroIfNone(dateObj.getMinutes())}:00 ${amOrPm}`;
}

String.prototype.getFormTime = function () {
    return "";
};

 String.prototype.getFormDate = function () {
   var str = this.valueOf();
    if (str == "") {return "";}
    else {
      str = str.split("/");
      return `${str[2]}-${Time.addLeadingZeroIfNone(str[1])}-${Time.addLeadingZeroIfNone(str[0])}`;
    }
};

 Date.prototype.getFormDate = function () {
   return `${this.getFullYear()}-${Time.addLeadingZeroIfNone(this.getMonth() + 1)}-${Time.addLeadingZeroIfNone(this.getDate())}`;
 }

 Date.prototype.getFormTime = function () {
   return `${Time.addLeadingZeroIfNone(this.getHours())}:${Time.addLeadingZeroIfNone(this.getMinutes())}`;
 }

 
