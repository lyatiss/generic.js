module.exports = function (grunt) {
	grunt.initConfig({
		mocha: {
			all: ['test/**/*.html']
		}
	});

	// Load plugin tasks
	grunt.loadNpmTasks('grunt-mocha');
};