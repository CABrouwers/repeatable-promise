
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
    var tm 
    df.then(() => { }).catch(() => { }).finally(() => { clearTimeout(tm) } )
    df.reset = (d = 0, val) =>{
        clearTimeout(tm)
        tm = setTimeout(() => { df.resolve(val) }, d)
    }
    df.reset(d,val)
    return df

}


function TimeOut(d = 0, val) {
    var df = new rp.Defer()
    var tm
    df.then(() => { }).catch(() => { }).finally(() => { clearTimeout(tm) })
    df.reset = (d = 0, val) => {
        clearTimeout(tm)
        tm = setTimeout(() => { df.fail(val) }, d)
    }
    df.reset(d, val)
    return df

}


function Queue(val) {
    var theQueue = Promise.resolve(val)

    this.enQueue = (f) => {
        if (f instanceof Promise) {
            theQueue = theQueue.then(() => { return f }, () => { return f })
        }
        else {
            theQueue = theQueue.then(f,f)
        }
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

    prom.terminate = (pl) => {
        queue = queue.then(() => {
            cycler.terminate(pl)
            prom.resolve(pl)
        })
        return queue
    }

    prom.fail = (pl) => {
        queue = queue.then(() => {
            cycler.fail(pl)
            prom.fail(pl)
        })
        return queue
    }


    return prom

}




module.exports = {
    Defer,
    Cycle,
    Delay,
    TimeOut,
    Queue
}

