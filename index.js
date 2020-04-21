
function Defer() {
    var res, rej;

    prom = new Promise((resolve, reject) => {
        res = resolve;
        rej = reject;
    });

    prom.resolve = res;
    prom.terminate = res;
    prom.reject = rej;
    prom.fail = rej;
    return prom
}


function Delay(d = 0, val) {
    var df = new Defer()
    var tm = setTimeout(() => { df.resolve(val) }, d)
    df.then(() => { clearTimeout(tm) })
    return df
}

function Queue(val) {
    var theQueue = Promise.resolve(val)
    this.enQueue = (f) => {
        theQueue = theQueue.then(f)
        return theQueue
    }
}



const inCycle = () => {

    var promise = new Defer();

    promise.repeat = (pl) => {
        promise.successor = inCycle();
        promise.successor.gen = pl
        promise.resolve(pl)
        return promise.successor
    }

    promise.terminate = (val) => {
        promise.resolve(val)
    }


    promise.fail = (val) => {
        promise.reject(val)
    }


    promise.reset = (pl, f, tracker, repo) => {
        if (repo.kill) { return }
        f(pl)
        
        promise.successor
            .then((pl) => {
                if (promise.successor.successor != undefined) {
                    promise.successor.reset(pl, f, tracker, repo)
                }
                else { tracker.resolve(pl) }
            })
            .catch((pl) => { tracker.reject(pl) })
    }

    promise.thenAgain = (f) => {

        let tracker = new Defer();
        let repo = {}

        tracker
            .then(() => { repo.kill = true })
            .catch(() => {})

        promise
            .then((pl) => {
                promise.reset(pl, f, tracker, repo);
            })
            .catch((pl) => { tracker.reject(pl) })
        return tracker
    }

    return promise;
}


function Cycle() {

    var queue = Promise.resolve()

    var cycler = inCycle();

    var prom = new Defer()

    prom.repeat = (pl) => {
        queue = queue.then(() => {
            cycler = cycler.repeat(pl)
        })
        return queue
    }

    prom.thenAgain = (f) => {
        return cycler.thenAgain(f)
    }


    prom.then(
        (val) => {
            queue = queue.then(() => {
                cycler.terminate(val)
            })
        },
        (v) => {
            queue = queue.then(() => {
                cycler.fail(v)
            })
        }
    )

    return prom

}




module.exports = {
    Defer,
    Cycle,
    Delay,
    Queue
}

