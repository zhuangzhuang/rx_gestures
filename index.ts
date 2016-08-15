/// <reference path="typings/tsd.d.ts" />
/// <reference path="node_modules/rx/ts/rx.all.d.ts" />

var fromEvent = Rx.Observable.fromEvent;

class Vector2 {
    constructor(public x: number, public y: number) {
    }
    add(that: Vector2) {
        return new Vector2(this.x + that.x, this.y + that.y);
    }
    sub(that: Vector2) {
        return new Vector2(this.x - that.x, this.y - that.y);
    }
    scale(s: number) {
        return new Vector2(this.x * s, this.y * s);
    }
    length() {
        var len = this.lengthSqr();
        return Math.sqrt(len);
    }
    lengthSqr() {
        var s = this.x * this.x + this.y * this.y; 
        return s;
    }
    distanceTo(that: Vector2) {
        var p = this.sub(that);
        return p.length();
    }
    distanceSqrTo(that: Vector2) {
        var p = this.sub(that);
        return this.lengthSqr();
    }
}

function _getTime() {
    return new Date().getTime();
}


function touch2Vector(t: TouchEvent) {
    var x = t.touches[0].pageX;
    var y = t.touches[0].pageY;
    return new Vector2(x, y);
}


class TouchWithTime {
    static from(e: TouchEvent) {
        return new TouchWithTime(e);
    }
    constructor(public e: TouchEvent, public time = _getTime()) {
    }
    timeDiff(other: TouchWithTime) {
        return this.time - other.time;
    }
    locationDiff(other: TouchWithTime) {
        var v_this = touch2Vector(this.e);
        var v_other = touch2Vector(other.e);
        return v_this.distanceTo(v_other);
    }
}


const LONG_TIME = 1000 // 判断是否是 long press

class Gestures {
    LongPress$: Rx.Observable<{}>;
    DoubleTap$: Rx.Observable<{}>;
    Pinch$: Rx.Observable<{}>;
    Rotate$: Rx.Observable<{}>;
    Move$: Rx.Observable<{}>;
    Swipe$: Rx.Observable<{}>;
    Tap$: Rx.Observable<{}>;

    constructor(el: HTMLElement) {
        var touchStart = fromEvent<TouchEvent>(el, 'touchstart'),
            touchMove = fromEvent<TouchEvent>(el, 'touchmove'),
            touchEnd = fromEvent<TouchEvent>(el, 'touchend');

        this.DoubleTap$ = touchStart.map(TouchWithTime.from)
            .bufferWithCount(2) // 检查每2个之间
            .filter(es => {
                var e0 = es[0];
                var e1 = es[1];
                if (e1.timeDiff(e0) >= 300) // 时间差测试
                    return false;
                if (e1.locationDiff(e0) >= 100) // 距离测试
                    return false;
                return true;
            });

        this.LongPress$ = touchStart.flatMap(e => {
            e.preventDefault();
            var moveOrUp = Rx.Observable.merge(touchMove, touchEnd);
            return Rx.Observable.just(e).delay(LONG_TIME).takeUntil(moveOrUp);
        });

        this.Tap$ = touchStart.map(TouchWithTime.from)
            .flatMap(start_e_t => {
                start_e_t.e.preventDefault();
                return touchMove.map(TouchWithTime.from)
                    .startWith(start_e_t) // 防止不移动
                    .takeUntil(touchEnd).last()
                    .filter(e => {
                        var curTime = _getTime();
                        if (curTime - start_e_t.time > LONG_TIME)
                            return false;
                        if (e.locationDiff(start_e_t) > 100)
                            return false;
                        return true;
                    })
            })
    }
}

// State
class State {
    pinch = 1
    angle = 0
    left = 0
    top = 0
    animating = false

    doubleTapped = false;
    constructor() {
    }
    switchDoubleTapped() {
        this.doubleTapped = !this.doubleTapped;
        if (this.doubleTapped) {
            this.pinch = 2.5;
        }
        else {
            this.pinch = 1;
        }
    }
}

// Use library
new Vue({
    el: '#app',
    methods: {
       
    },
    data: {
        state: new State()
    },
    ready() {
        var el = <HTMLImageElement>this.$el;
        var gestures = new Gestures(el);
        //gestures.DoubleTap$.subscribe(e => {
        //    var state = <State>this.state;
        //    state.switchDoubleTapped();
        //    console.log(`doubleTap: ${e}`);
        //});

        //gestures.LongPress$.subscribe(e => {
        //    console.log(`longTap: ${e}`);
        //});

        gestures.Tap$.subscribe(e => {
            console.log(`tap: ${e}`);
        });

    },
    computed: {
        img_class() {
            return "ss bb";
        },
        img_style() {
            var state = <State>this.state;
            return {
                transform: `scale(${state.pinch})`
            }
        }
    }
});
