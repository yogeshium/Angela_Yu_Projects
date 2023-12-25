import input from '@inquirer/input';
import * as fs from 'node:fs';
import qr from "qr-image";

const answer = await input({ message: 'Enter : ' });

var qr_svg = qr.image(answer, { type: 'png' });
qr_svg.pipe(fs.createWriteStream(answer+'.png'));
var svg_string = qr.imageSync(answer, { type: 'png' });

fs.writeFile(answer+'.txt',answer,(err)=>{
  if(err) console.log(err);
  else  console.log("File made successfully");
});