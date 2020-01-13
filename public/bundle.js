
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/Header.svelte generated by Svelte v3.16.7 */

    const file = "src/Header.svelte";

    function create_fragment(ctx) {
    	let header;
    	let div1;
    	let div0;
    	let a;
    	let strong;

    	const block = {
    		c: function create() {
    			header = element("header");
    			div1 = element("div");
    			div0 = element("div");
    			a = element("a");
    			strong = element("strong");
    			strong.textContent = "Meetups";
    			add_location(strong, file, 6, 8, 214);
    			attr_dev(a, "href", "/");
    			attr_dev(a, "class", "navbar-brand d-flex align-items-center");
    			add_location(a, file, 5, 6, 146);
    			attr_dev(div0, "class", "container d-flex justify-content-between");
    			add_location(div0, file, 4, 4, 85);
    			attr_dev(div1, "class", "navbar navbar-dark bg-dark shadow-sm");
    			add_location(div1, file, 3, 2, 30);
    			add_location(header, file, 2, 0, 19);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div1);
    			append_dev(div1, div0);
    			append_dev(div0, a);
    			append_dev(a, strong);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const meetupStore = writable([
      {
        id: "1",
        title: "Keyboard Cat",
        date: "01/02/2020",
        subtitle:
          "This is a wider card with supporting text below as a natural lead-in to additional content. This content is a little bit longer."
      },
      {
        id: "2",
        title: "Second Card",
        date: "02/03/2020",
        subtitle:
          "Some quick example text to build on the card title and make up the bulk of the cards content."
      }
    ]);

    /* src/components/Title.svelte generated by Svelte v3.16.7 */

    const file$1 = "src/components/Title.svelte";

    function create_fragment$1(ctx) {
    	let h1;
    	let t;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t = text(/*title*/ ctx[0]);
    			attr_dev(h1, "class", "svelte-17fkjfg");
    			add_location(h1, file$1, 4, 0, 40);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1) set_data_dev(t, /*title*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { title } = $$props;
    	const writable_props = ["title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Title> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    	};

    	$$self.$capture_state = () => {
    		return { title };
    	};

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    	};

    	return [title];
    }

    class Title extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment$1, safe_not_equal, { title: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<Title> was created without expected prop 'title'");
    		}
    	}

    	get title() {
    		throw new Error("<Title>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Title>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Button.svelte generated by Svelte v3.16.7 */

    const file$2 = "src/components/Button.svelte";

    function create_fragment$2(ctx) {
    	let button;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "type", /*type*/ ctx[0]);
    			attr_dev(button, "class", /*style*/ ctx[1]);
    			add_location(button, file$2, 14, 0, 242);
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 8) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    			}

    			if (!current || dirty & /*type*/ 1) {
    				attr_dev(button, "type", /*type*/ ctx[0]);
    			}

    			if (!current || dirty & /*style*/ 2) {
    				attr_dev(button, "class", /*style*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { type } = $$props;
    	let { size } = $$props;
    	let style;
    	
    	const writable_props = ["type", "size"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { type, size, style };
    	};

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("style" in $$props) $$invalidate(1, style = $$props.style);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*size*/ 4) {
    			 if (size === "normal") {
    				$$invalidate(1, style = "btn btn-primary");
    			} else if (size === "small") {
    				$$invalidate(1, style = "btn btn-sm btn-outline-secondary");
    			} else {
    				$$invalidate(1, style = "");
    			}
    		}
    	};

    	return [type, style, size, $$scope, $$slots, click_handler];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, { type: 0, size: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*type*/ ctx[0] === undefined && !("type" in props)) {
    			console.warn("<Button> was created without expected prop 'type'");
    		}

    		if (/*size*/ ctx[2] === undefined && !("size" in props)) {
    			console.warn("<Button> was created without expected prop 'size'");
    		}
    	}

    	get type() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Meetups/Event.svelte generated by Svelte v3.16.7 */
    const file$3 = "src/Meetups/Event.svelte";

    // (25:10) <Button type="button" size="small" on:click={onShowDetails}>
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Show Details");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(25:10) <Button type=\\\"button\\\" size=\\\"small\\\" on:click={onShowDetails}>",
    		ctx
    	});

    	return block;
    }

    // (26:10) <Button type="button" size="small" on:click>
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Favorite");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(26:10) <Button type=\\\"button\\\" size=\\\"small\\\" on:click>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div4;
    	let div3;
    	let img;
    	let img_src_value;
    	let t0;
    	let div2;
    	let h5;
    	let t1;
    	let t2;
    	let p;
    	let t3;
    	let t4;
    	let div1;
    	let div0;
    	let t5;
    	let t6;
    	let small;
    	let t7;
    	let current;

    	const button0 = new Button({
    			props: {
    				type: "button",
    				size: "small",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*onShowDetails*/ ctx[3]);

    	const button1 = new Button({
    			props: {
    				type: "button",
    				size: "small",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*click_handler*/ ctx[6]);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			img = element("img");
    			t0 = space();
    			div2 = element("div");
    			h5 = element("h5");
    			t1 = text(/*title*/ ctx[0]);
    			t2 = space();
    			p = element("p");
    			t3 = text(/*subtitle*/ ctx[1]);
    			t4 = space();
    			div1 = element("div");
    			div0 = element("div");
    			create_component(button0.$$.fragment);
    			t5 = space();
    			create_component(button1.$$.fragment);
    			t6 = space();
    			small = element("small");
    			t7 = text(/*date*/ ctx[2]);
    			if (img.src !== (img_src_value = "http://placehold.it/400x225")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$3, 18, 4, 410);
    			attr_dev(h5, "class", "card-title");
    			add_location(h5, file$3, 20, 6, 493);
    			attr_dev(p, "class", "card-text");
    			add_location(p, file$3, 21, 6, 535);
    			attr_dev(div0, "class", "btn-group");
    			add_location(div0, file$3, 23, 8, 649);
    			attr_dev(small, "class", "text-muted");
    			add_location(small, file$3, 27, 8, 860);
    			attr_dev(div1, "class", "d-flex justify-content-between align-items-center");
    			add_location(div1, file$3, 22, 6, 577);
    			attr_dev(div2, "class", "card-body");
    			add_location(div2, file$3, 19, 4, 463);
    			attr_dev(div3, "class", "card mb-4 shadow-sm");
    			add_location(div3, file$3, 17, 2, 372);
    			attr_dev(div4, "class", "col-md-4");
    			add_location(div4, file$3, 16, 0, 347);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, img);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, h5);
    			append_dev(h5, t1);
    			append_dev(div2, t2);
    			append_dev(div2, p);
    			append_dev(p, t3);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(button0, div0, null);
    			append_dev(div0, t5);
    			mount_component(button1, div0, null);
    			append_dev(div1, t6);
    			append_dev(div1, small);
    			append_dev(small, t7);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 1) set_data_dev(t1, /*title*/ ctx[0]);
    			if (!current || dirty & /*subtitle*/ 2) set_data_dev(t3, /*subtitle*/ ctx[1]);
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 128) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 128) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    			if (!current || dirty & /*date*/ 4) set_data_dev(t7, /*date*/ ctx[2]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(button0);
    			destroy_component(button1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { id = Math.random() } = $$props;
    	let { title } = $$props;
    	let { subtitle } = $$props;
    	let { date } = $$props;

    	const onShowDetails = () => {
    		dispatch("message", { text: "Hello!" });
    	};

    	const writable_props = ["id", "title", "subtitle", "date"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Event> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("subtitle" in $$props) $$invalidate(1, subtitle = $$props.subtitle);
    		if ("date" in $$props) $$invalidate(2, date = $$props.date);
    	};

    	$$self.$capture_state = () => {
    		return { id, title, subtitle, date };
    	};

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("subtitle" in $$props) $$invalidate(1, subtitle = $$props.subtitle);
    		if ("date" in $$props) $$invalidate(2, date = $$props.date);
    	};

    	return [title, subtitle, date, onShowDetails, id, dispatch, click_handler];
    }

    class Event extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$3, safe_not_equal, { id: 4, title: 0, subtitle: 1, date: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Event",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<Event> was created without expected prop 'title'");
    		}

    		if (/*subtitle*/ ctx[1] === undefined && !("subtitle" in props)) {
    			console.warn("<Event> was created without expected prop 'subtitle'");
    		}

    		if (/*date*/ ctx[2] === undefined && !("date" in props)) {
    			console.warn("<Event> was created without expected prop 'date'");
    		}
    	}

    	get id() {
    		throw new Error("<Event>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Event>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Event>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Event>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get subtitle() {
    		throw new Error("<Event>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subtitle(value) {
    		throw new Error("<Event>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get date() {
    		throw new Error("<Event>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set date(value) {
    		throw new Error("<Event>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/TextInput.svelte generated by Svelte v3.16.7 */

    const file$4 = "src/components/TextInput.svelte";

    // (13:4) {:else}
    function create_else_block(ctx) {
    	let input;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", /*controlType*/ ctx[0]);
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "id", /*id*/ ctx[1]);
    			input.value = /*value*/ ctx[3];
    			add_location(input, file$4, 13, 6, 300);
    			dispose = listen_dev(input, "input", /*input_handler_1*/ ctx[5], false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*controlType*/ 1) {
    				attr_dev(input, "type", /*controlType*/ ctx[0]);
    			}

    			if (dirty & /*id*/ 2) {
    				attr_dev(input, "id", /*id*/ ctx[1]);
    			}

    			if (dirty & /*value*/ 8) {
    				prop_dev(input, "value", /*value*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(13:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (11:4) {#if controlType === 'textarea'}
    function create_if_block(ctx) {
    	let textarea;
    	let dispose;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			attr_dev(textarea, "rows", "3");
    			attr_dev(textarea, "class", "form-control");
    			attr_dev(textarea, "id", /*id*/ ctx[1]);
    			textarea.value = /*value*/ ctx[3];
    			add_location(textarea, file$4, 11, 6, 208);
    			dispose = listen_dev(textarea, "input", /*input_handler*/ ctx[4], false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*id*/ 2) {
    				attr_dev(textarea, "id", /*id*/ ctx[1]);
    			}

    			if (dirty & /*value*/ 8) {
    				prop_dev(textarea, "value", /*value*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(11:4) {#if controlType === 'textarea'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let label_1;
    	let t0;
    	let t1;

    	function select_block_type(ctx, dirty) {
    		if (/*controlType*/ ctx[0] === "textarea") return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			label_1 = element("label");
    			t0 = text(/*label*/ ctx[2]);
    			t1 = space();
    			if_block.c();
    			attr_dev(label_1, "for", /*id*/ ctx[1]);
    			add_location(label_1, file$4, 8, 4, 132);
    			attr_dev(div, "class", "form-group");
    			add_location(div, file$4, 7, 0, 103);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label_1);
    			append_dev(label_1, t0);
    			append_dev(div, t1);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*label*/ 4) set_data_dev(t0, /*label*/ ctx[2]);

    			if (dirty & /*id*/ 2) {
    				attr_dev(label_1, "for", /*id*/ ctx[1]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { controlType } = $$props;
    	let { id } = $$props;
    	let { label } = $$props;
    	let { value } = $$props;
    	const writable_props = ["controlType", "id", "label", "value"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TextInput> was created with unknown prop '${key}'`);
    	});

    	function input_handler(event) {
    		bubble($$self, event);
    	}

    	function input_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("controlType" in $$props) $$invalidate(0, controlType = $$props.controlType);
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("label" in $$props) $$invalidate(2, label = $$props.label);
    		if ("value" in $$props) $$invalidate(3, value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { controlType, id, label, value };
    	};

    	$$self.$inject_state = $$props => {
    		if ("controlType" in $$props) $$invalidate(0, controlType = $$props.controlType);
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("label" in $$props) $$invalidate(2, label = $$props.label);
    		if ("value" in $$props) $$invalidate(3, value = $$props.value);
    	};

    	return [controlType, id, label, value, input_handler, input_handler_1];
    }

    class TextInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$4, safe_not_equal, {
    			controlType: 0,
    			id: 1,
    			label: 2,
    			value: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextInput",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*controlType*/ ctx[0] === undefined && !("controlType" in props)) {
    			console.warn("<TextInput> was created without expected prop 'controlType'");
    		}

    		if (/*id*/ ctx[1] === undefined && !("id" in props)) {
    			console.warn("<TextInput> was created without expected prop 'id'");
    		}

    		if (/*label*/ ctx[2] === undefined && !("label" in props)) {
    			console.warn("<TextInput> was created without expected prop 'label'");
    		}

    		if (/*value*/ ctx[3] === undefined && !("value" in props)) {
    			console.warn("<TextInput> was created without expected prop 'value'");
    		}
    	}

    	get controlType() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set controlType(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Meetups/UpdateEvent.svelte generated by Svelte v3.16.7 */
    const file$5 = "src/Meetups/UpdateEvent.svelte";

    // (25:2) <Button type="submit" size="normal">
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Add event");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(25:2) <Button type=\\\"submit\\\" size=\\\"normal\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let form;
    	let t0;
    	let t1;
    	let t2;
    	let current;
    	let dispose;

    	const textinput0 = new TextInput({
    			props: {
    				controlType: "text",
    				id: "title",
    				label: "Title:",
    				value: /*title*/ ctx[0]
    			},
    			$$inline: true
    		});

    	textinput0.$on("input", /*input_handler*/ ctx[5]);

    	const textinput1 = new TextInput({
    			props: {
    				controlType: "textarea",
    				id: "subtitle",
    				label: "Subtitle:",
    				value: /*subtitle*/ ctx[1]
    			},
    			$$inline: true
    		});

    	textinput1.$on("input", /*input_handler_1*/ ctx[6]);

    	const textinput2 = new TextInput({
    			props: {
    				controlType: "date",
    				id: "date",
    				label: "Date:",
    				value: /*date*/ ctx[2]
    			},
    			$$inline: true
    		});

    	textinput2.$on("input", /*input_handler_2*/ ctx[7]);

    	const button = new Button({
    			props: {
    				type: "submit",
    				size: "normal",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			form = element("form");
    			create_component(textinput0.$$.fragment);
    			t0 = space();
    			create_component(textinput1.$$.fragment);
    			t1 = space();
    			create_component(textinput2.$$.fragment);
    			t2 = space();
    			create_component(button.$$.fragment);
    			add_location(form, file$5, 19, 0, 478);
    			dispose = listen_dev(form, "submit", prevent_default(/*onAddEvent*/ ctx[3]), false, true, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			mount_component(textinput0, form, null);
    			append_dev(form, t0);
    			mount_component(textinput1, form, null);
    			append_dev(form, t1);
    			mount_component(textinput2, form, null);
    			append_dev(form, t2);
    			mount_component(button, form, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const textinput0_changes = {};
    			if (dirty & /*title*/ 1) textinput0_changes.value = /*title*/ ctx[0];
    			textinput0.$set(textinput0_changes);
    			const textinput1_changes = {};
    			if (dirty & /*subtitle*/ 2) textinput1_changes.value = /*subtitle*/ ctx[1];
    			textinput1.$set(textinput1_changes);
    			const textinput2_changes = {};
    			if (dirty & /*date*/ 4) textinput2_changes.value = /*date*/ ctx[2];
    			textinput2.$set(textinput2_changes);
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textinput0.$$.fragment, local);
    			transition_in(textinput1.$$.fragment, local);
    			transition_in(textinput2.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textinput0.$$.fragment, local);
    			transition_out(textinput1.$$.fragment, local);
    			transition_out(textinput2.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			destroy_component(textinput0);
    			destroy_component(textinput1);
    			destroy_component(textinput2);
    			destroy_component(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let title = "";
    	let subtitle = "";
    	let date = "";

    	const onAddEvent = () => {
    		meetupStore.update(events => {
    			return [{ id: Math.random(), title, subtitle, date }, ...events];
    		});
    	};

    	const input_handler = event => $$invalidate(0, title = event.target.value);
    	const input_handler_1 = event => $$invalidate(1, subtitle = event.target.value);
    	const input_handler_2 = event => $$invalidate(2, date = event.target.value);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("subtitle" in $$props) $$invalidate(1, subtitle = $$props.subtitle);
    		if ("date" in $$props) $$invalidate(2, date = $$props.date);
    	};

    	return [
    		title,
    		subtitle,
    		date,
    		onAddEvent,
    		dispatch,
    		input_handler,
    		input_handler_1,
    		input_handler_2
    	];
    }

    class UpdateEvent extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UpdateEvent",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/Meetups/Meetups.svelte generated by Svelte v3.16.7 */
    const file$6 = "src/Meetups/Meetups.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (35:2) {#each meetups as meetup, i (meetup.id)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let current;
    	const event_spread_levels = [/*meetup*/ ctx[5]];
    	let event_props = {};

    	for (let i = 0; i < event_spread_levels.length; i += 1) {
    		event_props = assign(event_props, event_spread_levels[i]);
    	}

    	const event = new Event({ props: event_props, $$inline: true });
    	event.$on("click", /*onAddToFavorite*/ ctx[2]);
    	event.$on("message", /*handleMessage*/ ctx[3]);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(event.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(event, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const event_changes = (dirty & /*meetups*/ 1)
    			? get_spread_update(event_spread_levels, [get_spread_object(/*meetup*/ ctx[5])])
    			: {};

    			event.$set(event_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(event.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(event.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(event, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(35:2) {#each meetups as meetup, i (meetup.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let section;
    	let t0;
    	let t1;
    	let t2;
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t3;
    	let b;
    	let t4_value = /*favoriteEvents*/ ctx[1].length + "";
    	let t4;
    	let t5;
    	let current;

    	const title0 = new Title({
    			props: { title: "New Event" },
    			$$inline: true
    		});

    	const updateevent = new UpdateEvent({ $$inline: true });

    	const title1 = new Title({
    			props: { title: "List of Available meetups" },
    			$$inline: true
    		});

    	let each_value = /*meetups*/ ctx[0];
    	const get_key = ctx => /*meetup*/ ctx[5].id;

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			create_component(title0.$$.fragment);
    			t0 = space();
    			create_component(updateevent.$$.fragment);
    			t1 = space();
    			create_component(title1.$$.fragment);
    			t2 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = text("\n\n  You have ");
    			b = element("b");
    			t4 = text(t4_value);
    			t5 = text(" favorite events.");
    			attr_dev(div, "class", "row");
    			add_location(div, file$6, 33, 2, 703);
    			add_location(b, file$6, 39, 11, 873);
    			add_location(section, file$6, 27, 0, 591);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			mount_component(title0, section, null);
    			append_dev(section, t0);
    			mount_component(updateevent, section, null);
    			append_dev(section, t1);
    			mount_component(title1, section, null);
    			append_dev(section, t2);
    			append_dev(section, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(section, t3);
    			append_dev(section, b);
    			append_dev(b, t4);
    			append_dev(section, t5);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const each_value = /*meetups*/ ctx[0];
    			group_outros();
    			each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block, null, get_each_context);
    			check_outros();
    			if ((!current || dirty & /*favoriteEvents*/ 2) && t4_value !== (t4_value = /*favoriteEvents*/ ctx[1].length + "")) set_data_dev(t4, t4_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title0.$$.fragment, local);
    			transition_in(updateevent.$$.fragment, local);
    			transition_in(title1.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title0.$$.fragment, local);
    			transition_out(updateevent.$$.fragment, local);
    			transition_out(title1.$$.fragment, local);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(title0);
    			destroy_component(updateevent);
    			destroy_component(title1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let meetups = [];
    	let favoriteEvents = [];
    	const unsubscribe = meetupStore.subscribe(d => $$invalidate(0, meetups = d));

    	onDestroy(() => {
    		if (unsubscribe) {
    			unsubscribe();
    		}
    	});

    	const onAddToFavorite = event => {
    		$$invalidate(1, favoriteEvents = [event, ...favoriteEvents]);
    	};

    	const handleMessage = event => {
    		console.log(event);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("meetups" in $$props) $$invalidate(0, meetups = $$props.meetups);
    		if ("favoriteEvents" in $$props) $$invalidate(1, favoriteEvents = $$props.favoriteEvents);
    	};

    	return [meetups, favoriteEvents, onAddToFavorite, handleMessage];
    }

    class Meetups extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Meetups",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.16.7 */
    const file$7 = "src/App.svelte";

    function create_fragment$7(ctx) {
    	let t;
    	let main;
    	let current;
    	const header = new Header({ $$inline: true });
    	const meetups = new Meetups({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t = space();
    			main = element("main");
    			create_component(meetups.$$.fragment);
    			attr_dev(main, "class", "container");
    			add_location(main, file$7, 6, 0, 119);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(meetups, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(meetups.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(meetups.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(main);
    			destroy_component(meetups);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    const app = new App({ target: document.body });

    return app;

}());
//# sourceMappingURL=bundle.js.map
