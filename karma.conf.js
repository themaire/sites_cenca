module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine'],
        files: [
            'src/app/hello-world.spec.ts'
        ],
        browsers: ['Chrome'],
        singleRun: true
    });
};