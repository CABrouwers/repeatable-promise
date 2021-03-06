
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


function Delay(d, val) {
    var df = new Defer()
    var tm 
    df.then(() => { }).catch(() => { }).finally(() => { clearTimeout(tm) } )
    df.reset = (d, val) =>{
        clearTimeout(tm)
        if (d || d==0) { tm = setTimeout(() => { df.resolve(val) }, d)}      
    }
    df.reset(d,val)
    return df

}


function TimeOut(d, val) {
    var df = new Defer()
    var tm
    df.then(() => { }).catch(() => { }).finally(() => { clearTimeout(tm) })
    df.reset = (d, val) => {
        clearTimeout(tm)
        if (d || d == 0) { tm = setTimeout(() => { df.fail(val) }, d) }
    }
    df.reset(d, val)
    return df

}


function Queue() {
    var theQueue = Promise.resolve()

    this.enQueue = (f) => {
        var df = new Defer()
        df.catch(() => { })
        if (f instanceof Promise) {
            theQueue = theQueue.then(() => { return f }).then(df.resolve, df.fail)
        }
        else {
            theQueue = theQueue.then(f).then(df.resolve, df.fail)
        }
        return df
    }

}


const inCycle = () => {

    var promise = new Defer();

    promise.repeat = (pl) => {
        promise.successor = inCycle();
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
                if (promise.successor.successor) {
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
            .catch(() => { })

        promise
            .then((pl) => {
                if (promise.successor) {
                    promise.reset(pl, f, tracker, repo)
                }
                else { tracker.resolve(pl) }
            })
            .catch((pl) => { tracker.reject(pl) })
        return tracker
    }

    promise.thenOnce = (f) => { return promise.then(f) }

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

    prom.thenOnce = (f) => {
        return cycler.thenOnce(f)
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

