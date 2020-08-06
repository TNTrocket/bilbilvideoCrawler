#!/usr/bin/env node
const inquirer = require('inquirer');
const {
    openBililUrl
} = require('./main');
let Spinner = require('cli-spinner').Spinner;
const program = require('commander');

program
  .version(require('./package').version)
	.usage('<command> [项目名称]')
    .parse(process.argv)

inquirer.prompt([{
    type: 'input',
    message: '请输入需要下载的b站视频地址:',
    name: 'url'
}]).then((answers) => {
    let spinner = new Spinner('processing.. %s');
    spinner.setSpinnerString('|/-\\');
    spinner.start();
    openBililUrl(answers.url).then(() => {
        spinner.stop();
    }).catch(() => {
        spinner.stop();
    })
})