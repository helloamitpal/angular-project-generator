var chalk = require('chalk');
var json = require('json-update');
var shell = require('shelljs/global');
var clear = require('clear');
var CLI = require('clui');
var figlet = require('figlet');
var inquirer = require('inquirer');
var Spinner = CLI.Spinner;
var files = require('./lib/files');

clear();
console.log(chalk.green(figlet.textSync('Apttus', { horizontalLayout: 'full' })));
console.log(chalk.yellow(figlet.textSync('UI Project', { horizontalLayout: 'full' })));
console.log(chalk.red(figlet.textSync('Setup', { horizontalLayout: 'full' })));

getDetails(function(){
	var input = arguments[0];

	// initializing process to setup new UI project
	var status = new Spinner('Creating project setup for you, please wait...');
	status.start();

	var template = files.template;
	// entering specified project path
	cd(input.path);

	// creating a folder with project name
	mkdir('-p', input.path+"/"+input.name);

	// executing git clone command for cloning UI project repository
	exec('git clone https://'+input.bitbucketId+'@bitbucket.org/apal-apttus/'+template+'.git');

	// As renaming is not possible, moving all content from downloaded folder to project folder
	mv('-f', input.path+"/"+template+"/*", input.path+"/"+input.name+"/");

	// entering in project name folder
	cd(input.name);		

	// updating package.json file as per user input
	json.update(input.path+"/"+input.name+"/package.json", {
		name: input.name,
		description: input.description
	}).then(function(){
		// deleting downloaded template repo
		rm('-rf', input.path+"/"+template+"/");

		// executing git fetch
		exec('git fetch');

		// installing all required dependencies locally
		exec('npm install', function(){
			// process is completed
			status.stop();	

			console.log(chalk.bold.green('Your project setup is completed'));
			console.log(chalk.bold.red('Use this command to run your application: gulp run'));
			
			// entering in project directory
			cd(input.path+"/"+input.name);					
			
			// getting user input to run the application
			getUserInput(function(){
				var action = arguments[0].action;

				if(action) {
					exec('gulp run');
				}
			});
		});		
	});
});


// getting user input to run the application
function getUserInput(callback) {
	var question = [{
	  name: 'action',
	  type: 'input',
	  message: 'Do you want to run your application now [y/n]?:',
	  validate: function( value ) {	  	
	    if (value.length && ["y","n"].indexOf(value.toLowerCase()) >= 0) {
	      return (value.toLowerCase() === 'y') ? true : false;
	    } else {
	      return "Please enter either 'y' or 'n'";
	    }
	  }
	}];

	// executing callback after fetching input from user
	inquirer.prompt(question).then(callback);
}

// fetching user input for setting up project
function getDetails(callback) {
	
	var questions = [{
	  name: 'bitbucketId',
	  type: 'input',
	  message: 'Enter your Bitbucket username [without space]:',
	  validate: function( value ) {	  	
	    if (value.length && value.indexOf(" ") < 0) {
	      return true;
	    } else {
	      return 'Please enter valid username';
	    }
	  }
	},
	{
	  name: 'name',
	  type: 'input',
	  message: 'Enter your project name [without space]:',
	  validate: function(value) {
	    if (value.length && value.indexOf(" ") < 0) {
	      return true;
	    } else {
	      return 'Please enter valid project name';
	    }
	  }
	},
	{
	  name: 'description',
	  type: 'input',
	  message: 'Enter your project description:',
	  validate: function(value) {
	    if (value.length) {
	      return true;
	    } else {
	      return 'Please enter project description';
	    }
	  }
	},
	{
	  name: 'path',
	  type: 'input',
	  message: 'Enter your project destination path [For example: c:/test or /usr/tmp/]:',
	  validate: function(value) {
	    if (value.length && value.indexOf("/") >= 0 && files.directoryExists(value)) {
	      return true;
	    } else {
	      return 'Please enter valid project path';
	    }
	  }
	}];

	// executing callback after fetching input from user
	inquirer.prompt(questions).then(callback);
}