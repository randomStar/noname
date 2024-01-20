"use strict";

new Promise(resolve => {
	// 客户端自带core.js的请注意跟进
	if ('__core-js_shared__' in window) resolve(null);
	else {
		const nonameInitialized = localStorage.getItem('noname_inited');
		const assetURL = typeof nonameInitialized != 'string' || nonameInitialized == 'nodejs' ? '' : nonameInitialized;
		const coreJSBundle = document.createElement('script');
		coreJSBundle.onerror = coreJSBundle.onload = resolve;
		coreJSBundle.src = `${assetURL}game/core-js-bundle.js`;
		document.head.appendChild(coreJSBundle);
	}
}).then(() => {
	const nonameInitialized = localStorage.getItem('noname_inited');
	const assetURL = typeof nonameInitialized != 'string' || nonameInitialized == 'nodejs' ? '' : nonameInitialized;
	const userAgent = navigator.userAgent.toLowerCase();

	const exit = () => {
		const ios = userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('macintosh');
		//electron
		if (typeof window.process == 'object' && typeof window.require == 'function') {
			const versions = window.process.versions;
			// @ts-ignore
			const electronVersion = parseFloat(versions.electron);
			let remote;
			if (electronVersion >= 14) {
				// @ts-ignore
				remote = require('@electron/remote');
			} else {
				// @ts-ignore
				remote = require('electron').remote;
			}
			const thisWindow = remote.getCurrentWindow();
			thisWindow.destroy();
			window.process.exit();
		}
		//android-cordova环境
		//ios-cordova环境或ios浏览器环境
		//非ios的网页版
		else if (!ios) {
			window.close();
		}
	};

	if (!localStorage.getItem('gplv3_noname_alerted')) {
		if (confirm('①无名杀是一款基于GPLv3协议的开源软件！\n你可以在遵守GPLv3协议的基础上任意使用，修改并转发《无名杀》，以及所有基于《无名杀》开发的拓展。\n点击“确定”即代表您认可并接受GPLv3协议↓️\nhttps://www.gnu.org/licenses/gpl-3.0.html\n②无名杀官方发布地址仅有GitHub仓库！\n其他所有的所谓“无名杀”社群（包括但不限于绝大多数“官方”QQ群、QQ频道等）均为玩家自发组织，与无名杀官方无关！')) {
			// @ts-ignore
			localStorage.setItem('gplv3_noname_alerted', true);
		}
		else {
			exit();
		}
	}
	window['b' + 'ann' + 'e' + 'dE' + 'x' + 'ten' + 's' + 'i' + 'o' + 'ns'] = ['\u4fa0\u4e49', '\u5168\u6559\u7a0b'];

	/**
	 *
	 * @returns {["firefox" | "chrome" | "safari" | "other", number]}
	 */
	function coreInfo() {
		const regex = /(firefox|chrome|safari)\/([\d.]+)/;
		let result;
		if (!(result = userAgent.match(regex))) return ["other", NaN];
		if (result[1] !== "safari") return [result[1], parseInt(result[2])];
		result = userAgent.match(/version\/([\d.]+).*safari/);
		// @ts-ignore
		return ["safari", parseInt(result[1])];
	}
	const [core, version] = coreInfo();
	const supportMap = {
		"firefox": 60,
		"chrome": 61,
		// 因为coreInfo不考虑子版本，故就强行只能以11运行
		"safari": 11
	}

	if (core in supportMap && supportMap[core] > version) {
		const tip = '检测到您的浏览器内核版本无法支持ES Module，请立即升级浏览器或手机webview内核！';
		console.error(tip);
		const redirect_tip = '您使用的浏览器或无名杀客户端内核版本过低，已经无法正常运行无名杀！\n点击“确认”以前往GitHub下载最新版无名杀客户端（可能需要科学上网）。\n稍后您的无名杀将自动退出（可能的话）';
		if (confirm(redirect_tip)) {
			window.open('https://github.com/libccy/noname/releases/tag/chromium77-client');
		}
		exit()
	}
	else {
		const script = document.createElement('script')
		script.type = "module";
		script.src = `${assetURL}game/entry.js`
		script.async = true
		script.onerror = (event) => {
			console.error(event)
			const message = `您使用的浏览器或《无名杀》客户端加载内容失败！\n若您使用的客户端为自带内核的旧版“兼容版”，请及时更新客户端版本！\n若您使用的客户端为手机端的非兼容版《无名杀》，请尝试更新手机的WebView内核，或者更换为1.8.2版本及以上的兼容版！\n若您是直接使用浏览器加载index.html进行游戏，请改为运行文件夹内的“noname-server.exe”（或使用VSCode等工具启动Live Server），以动态服务器的方式启动《无名杀》！`;
			console.error(message);
			alert(message);
			exit()
		}
		document.head.appendChild(script)
	}
});
