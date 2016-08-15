/// <reference path="typings/tsd.d.ts" />
/// <reference path="node_modules/rx/ts/rx.all.d.ts" />
var fromEvent = Rx.Observable.fromEvent;
var Vector2 = (function () {
    function Vector2(x, y) {
        this.x = x;
        this.y = y;
    }
    Vector2.prototype.add = function (that) {
        return new Vector2(this.x + that.x, this.y + that.y);
    };
    Vector2.prototype.sub = function (that) {
        return new Vector2(this.x - that.x, this.y - that.y);
    };
    Vector2.prototype.scale = function (s) {
        return new Vector2(this.x * s, this.y * s);
    };
    Vector2.prototype.length = function () {
        var len = this.lengthSqr();
        return Math.sqrt(len);
    };
    Vector2.prototype.lengthSqr = function () {
        var s = this.x * this.x + this.y * this.y;
        return s;
    };
    Vector2.prototype.distanceTo = function (that) {
        var p = this.sub(that);
        return p.length();
    };
    Vector2.prototype.distanceSqrTo = function (that) {
        var p = this.sub(that);
        return this.lengthSqr();
    };
    return Vector2;
}());
function _getTime() {
    return new Date().getTime();
}
function touch2Vector(t) {
    var x = t.touches[0].pageX;
    var y = t.touches[0].pageY;
    return new Vector2(x, y);
}
var TouchWithTime = (function () {
    function TouchWithTime(e, time) {
        if (time === void 0) { time = _getTime(); }
        this.e = e;
        this.time = time;
    }
    TouchWithTime.from = function (e) {
        return new TouchWithTime(e);
    };
    TouchWithTime.prototype.timeDiff = function (other) {
        return this.time - other.time;
    };
    TouchWithTime.prototype.locationDiff = function (other) {
        var v_this = touch2Vector(this.e);
        var v_other = touch2Vector(other.e);
        return v_this.distanceTo(v_other);
    };
    return TouchWithTime;
}());
var LONG_TIME = 1000; // �ж��Ƿ��� long press
var Gestures = (function () {
    function Gestures(el) {
        var touchStart = fromEvent(el, 'touchstart'), touchMove = fromEvent(el, 'touchmove'), touchEnd = fromEvent(el, 'touchend');
        this.DoubleTap$ = touchStart.map(TouchWithTime.from)
            .bufferWithCount(2) // ����ÿ2��֮��
            .filter(function (es) {
            var e0 = es[0];
            var e1 = es[1];
            if (e1.timeDiff(e0) >= 300)
                return false;
            if (e1.locationDiff(e0) >= 100)
                return false;
            return true;
        });
        this.LongPress$ = touchStart.flatMap(function (e) {
            e.preventDefault();
            var moveOrUp = Rx.Observable.merge(touchMove, touchEnd);
            return Rx.Observable.just(e).delay(LONG_TIME).takeUntil(moveOrUp);
        });
        this.Tap$ = touchStart.map(TouchWithTime.from)
            .flatMap(function (start_e_t) {
            start_e_t.e.preventDefault();
            return touchMove.map(TouchWithTime.from)
                .startWith(start_e_t) // ��ֹ���ƶ�
                .takeUntil(touchEnd).last()
                .filter(function (e) {
                var curTime = _getTime();
                if (curTime - start_e_t.time > LONG_TIME)
                    return false;
                if (e.locationDiff(start_e_t) > 100)
                    return false;
                return true;
            });
        });
    }
    return Gestures;
}());
// State
var State = (function () {
    function State() {
        this.pinch = 1;
        this.angle = 0;
        this.left = 0;
        this.top = 0;
        this.animating = false;
        this.doubleTapped = false;
    }
    State.prototype.switchDoubleTapped = function () {
        this.doubleTapped = !this.doubleTapped;
        if (this.doubleTapped) {
            this.pinch = 2.5;
        }
        else {
            this.pinch = 1;
        }
    };
    return State;
}());
// Use library
new Vue({
    el: '#app',
    methods: {},
    data: {
        state: new State()
    },
    ready: function () {
        var el = this.$el;
        var gestures = new Gestures(el);
        //gestures.DoubleTap$.subscribe(e => {
        //    var state = <State>this.state;
        //    state.switchDoubleTapped();
        //    console.log(`doubleTap: ${e}`);
        //});
        //gestures.LongPress$.subscribe(e => {
        //    console.log(`longTap: ${e}`);
        //});
        gestures.Tap$.subscribe(function (e) {
            console.log("tap: " + e);
        });
    },
    computed: {
        img_class: function () {
            return "ss bb";
        },
        img_style: function () {
            var state = this.state;
            return {
                transform: "scale(" + state.pinch + ")"
            };
        }
    }
});
