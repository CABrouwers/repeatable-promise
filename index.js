
function Defer() {
    var res, rej;

    var promise = new Promise((resolve, reject) => {
        res = resolve;
        rej = reject;
    });

    this.resolve = res;
    this.terminate = res;
    this.reject = rej;
    this.then = (f) => { return promise.then(f) };
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

    var promise = inCycle();

    this.repeat = (pl) => {
        queue = queue.then(() => {
            promise = promise.repeat(pl)
        })
        return queue
    }

    this.thenAgain = (f) => {
        return promise.thenAgain(f)
    }

    this.fail = (v) => {
        queue = queue.then(() => {
             promise.fail(v)
        })
        return queue
    }

    this.terminate = (val) => {
        queue = queue.then(() => {
             promise.terminate(val)
        })
        return queue
    }

}





module.exports = {
    Defer,
    Cycle,
}

