import { AI as ai } from '../../ai/index.js';
import { Get as get } from '../../get/index.js';
import { Game as game } from '../../game/index.js';
import { Library as lib } from "../index.js";
import { status as _status } from '../../status/index.js';
import { UI as ui } from '../../ui/index.js';
import { AsyncFunction } from '../../util/index.js';

/**
 * 将事件Promise化以使用async异步函数来执行事件。
 * 
 * 事件Promise化后，需要既能使用await等待事件完成，
 * 又需要在执行之前对事件进行配置。
 * 
 * 所以这个类的实例集成了事件和Promise二者的所有属性，
 * 且Promise的原有属性无法被修改，一切对这个类实例的属性修改，删除，
 * 再配置等操作都会转发到事件对应的属性中。
 * 
 * @todo 需要完成异步事件的debugger方法
 * 
 * @example
 * 使用await xx()等待异步事件执行：
 * ```js
 * await game.xxx().setContent('yyy').set(zzz, 'i');
 * ```
 * 使用await player.xxx()等待异步事件执行：
 * ```js
 * await player.draw(2);
 * game.log('等待', player, '摸牌完成执行log');
 * ```
 */
export class GameEventPromise extends Promise {
	// 我谢谢你，这里是必须有的
	// 否则Promise的方法对其子类无效
	static get [Symbol.species]() {
		return Promise;
	}
	#event;
	/**
	 * @param { GameEvent | GameEventPromise } arg
	 */
	constructor(arg) {
		if (arg instanceof GameEventPromise)
			throw new Error("GameEventPromise cannot copy.")
		/**
		 * @type {GameEvent}
		 */
		const event = arg;
		super(resolve => {
			// 设置为异步事件
			event.async = true;
			// 事件结束后触发resolve
			event.resolve = resolve;
			if (!_status.event) return;
			// game.createEvent的时候还没立即push到next里
			Promise.resolve().then(() => {
				game.executingAsyncEventMap.set(_status.event.toEvent(), (game.executingAsyncEventMap.get(_status.event.toEvent()) || Promise.resolve()).then(() => {
					let eventPromise = _status.event.next.find(e => e.toEvent() == event);
					// 如果父级事件也是一个异步的话，那应该立即执行这个事件的
					// 如果在AsyncFunction执行过程中在别的位置新建了一个异步事件，那也直接（等会set配置完）执行
					if (eventPromise && (_status.event.content instanceof AsyncFunction || Array.isArray(_status.event.contents))) {
						// 异步执行game.loop
						// 不直接game.loop(event)是因为需要让别人可以手动set()和setContent()
						// 再执行game.loop是因为原有的game.loop被await卡住了，
						// 得新执行一个只执行这个异步事件的game.loop

						// 事件自行处理skip情况
						if (event.player && event.player.skipList.includes(event.name)) {
							_status.event.trigger(event.name + 'Skipped');
							event.player.skipList.remove(event.name);
							if (lib.phaseName.includes(event.name)) event.player.getHistory('skipped').add(event.name);
							_status.event.next.remove(eventPromise);
							event.finish();
							resolve();
							return eventPromise;
						}

						if (_status.event != eventPromise) {
							eventPromise.parent = _status.event;
							_status.event = eventPromise;
							game.getGlobalHistory('everything').push(eventPromise);
						}
						return game.loop(eventPromise).then(() => {
							// 有时候event.finished还是false
							return eventPromise;
						});
					}
				}));
			});
		});
		this.#event = event;
		return new Proxy(this, {
			get(target, prop, receiver) {
				const thisValue = Reflect.get(target, prop);
				if (thisValue) {
					if (typeof thisValue == 'function') {
						return thisValue.bind(target);
					}
					return thisValue;
				}
				const eventValue = Reflect.get(event, prop);
				return eventValue == event ? receiver : eventValue;
			},
			set(target, prop, newValue) {
				return Reflect.set(event, prop, newValue);
			},
			deleteProperty(target, prop) {
				return Reflect.deleteProperty(event, prop);
			},
			defineProperty(target, prop, attributes) {
				return Reflect.defineProperty(event, prop, attributes);
			},
			has(target, prop) {
				return Reflect.has(event, prop);
			},
			ownKeys(target) {
				return Reflect.ownKeys(event);
			},
			getOwnPropertyDescriptor(target, prop) {
				return Reflect.getOwnPropertyDescriptor(event, prop);
			},
		});
	}
	/** 获取原事件对象 */
	toEvent() {
		return this.#event;
	}
	/**
	 * 在某个异步事件中调试变量信息
	 * 
	 * 注: 在调试步骤中`定义的变量只在当前输入的语句有效`
	 * 
	 * @example
	 * 在技能中调试技能content相关的信息
	 * ```js
	 * await event.debugger();
	 * ```
	 * 在技能中调试触发此技能事件的相关的信息
	 * ```js
	 * await trigger.debugger();
	 * ```
	 */
	async debugger() {
		return new Promise(resolve => {
			const runCode = function (event, code) {
				try {
					// 为了使玩家调试时使用var player=xxx时不报错，故使用var
					var { player, _trigger: trigger, _result: result } = event;
					return eval(code);
				} catch (error) {
					return error;
				}
			}.bind(window);
			const inputCallback = inputResult => {
				if (inputResult === false) {
					resolve(null);
				} else {
					const obj = runCode(this.toEvent(), inputResult);
					alert((!obj || obj instanceof Error) ? String(obj) : get.stringify(obj));
					game.promises.prompt('debugger调试').then(inputCallback);
				}
			};
			game.promises.prompt('debugger调试').then(inputCallback);
		});
	}
}
