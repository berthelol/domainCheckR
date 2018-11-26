require('dotenv').config();

const chalk = require('chalk');
const schedule = require('node-schedule');
const _ = require('lodash');
const axios = require('axios');
const FormData = require('form-data');
const mailjet = require ('node-mailjet').connect(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE);

console.log(chalk.magentaBright('Starting Service'));

let domainCheck = "";
let extWanted = [];
try{
  ({ domainCheck, extWanted } = process.env);
  extWanted = JSON.parse(extWanted);
}catch(e) {
  console.error(e, chalk.red("Cannot Parse domain name to check"));
}

const cron = schedule.scheduleJob(process.env.CRON, () => {
  checkDomain(domainCheck);
});

function checkDomain(domain){
  askNameCheckR(domain)
  .then(({ data: domains }) => {
    _.forEach(extWanted, extention => {
      console.log();
      const domainExt = `${domain}${extention}`;
      const domainFound = _.find(domains, ['domain', domainExt]) || { domain: domainExt, status: 'taken' };
      console.log("Status for:", chalk.yellow(domainFound.domain));
      if (domainFound.status === "available"){
        console.log(chalk.green(domainFound.status));
        // Send mail
        sendMail(domainFound.domain);
      }
      else{
        console.log(chalk.red(domainFound.status));
      }
    });
  })
  .catch(console.error);
}

function askNameCheckR(domainName) {
  console.log(chalk.blue("Checking: "), chalk.yellow(domainName));
  const bodyFormData = new FormData();
  bodyFormData.append('keyword', domainName);

  return axios
  .create({
    headers: bodyFormData.getHeaders()
  })
  .post('https://www.namecheck.com/check/gtld/', bodyFormData)
}

function sendMail(domain) {
  mailjet
	.post("send", {'version': 'v3.1'})
	.request({
		"Messages":[
			{
				"From": {
					"Email": "loic.berthelot1@gmail.com",
					"Name": "Loïc Berthelot"
				},
				"To": [
					{
						"Email": "loic.berthelot1@gmail.com",
						"Name": "Louc"
					}
				],
				"TemplateID": 608554,
				"TemplateLanguage": true,
				"Subject": "Domain CheckR",
				"Variables": {
      "domainName": domain
    }
			}
		]
	})
	.then(() => {
		console.log(chalk.green("Mail sent for:"), chalk.yellow(domain));
	})
	.catch(console.error)
}