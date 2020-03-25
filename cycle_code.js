
const defer = () => {
    var res, rej;

    var promise = new Promise((resolve, reject) => {
        res = resolve;
        rej = reject;
    });

    promise.resolve = res;
    promise.reject = rej;

    return promise;
}



const incycle = () => {


    var promise = defer();

    promise.repeat = (pl) => {
        promise.successor = incycle();
        promise.resolve(pl)
        return promise.successor
    }



    promise.reset = (pl, f, obj, st) => {

        if (promise.successor == null) {
            obj.lastwill()
            return null;
        }

        if (obj.killswitch) {
            if (st) { obj.lastwill(pl) }
            else { obj.lastwill() }
            return null;
        }
        if (st) { f(pl) };

        promise.successor
            .then((pl) => {
                promise.successor.reset(pl, f, obj, true);
            })
            .catch((pl) => {
                promise.successor.reset(pl, f, obj, false);
            })
    }

    promise.thenAgain = (f, g = null) => {

        let obj = defer();
        obj.killswitch = false
        obj.then(() => { obj.killswitch = true })
        obj.lastwill = () => { };
        obj.finalize = (g) => { obj.lastwill = g }

        promise
            .then((pl) => {
                promise.reset(pl, f, obj, true);
            })
            .catch((pl) => {
                promise.reset(pl, f, obj, false);
            })




        return obj
    }



    return promise;
}

const cycle = () => {

    var handle = new Object();

    var promise = incycle();

    handle.repeat = (pl) => {
        promise = promise.repeat(pl)
        return handle
    }

    handle.thenAgain = (f) => {
        return promise.thenAgain(f)
    }

    handle.resolve = (pl) => {
        return promise.resolve(pl);
    }
    return handle;
}



module.exports = {
    defer,
    cycle,
}

