module.exports = {
	globDirectory: '.',
	globPatterns: [
		'**/*.{mp3,js,ttf,jpg,png,gif,html,css,woff2}'
	],
	swDest: 'sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	],
	maximumFileSizeToCacheInBytes: 200000000
};
