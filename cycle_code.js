
function Defer() {
    var res, rej;

    var promise = new Promise((resolve, reject) => {
        res = resolve;
        rej = reject;
    });

    this.resolve = res;
    this.reject = rej;
    this.then = (f) => { return promise.then(f) };
    this.catch = (f) => { return promise.catch(f) };
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
    }

    promise.thenAgain = (f) => {

        let tracker = new Defer();
        let repo = {}

        tracker
            .then(() => { repo.kill = true })

        promise
            .then((pl) => {
                promise.reset(pl, f, tracker, repo);
            })

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
        return this
    }

    this.thenAgain = (f) => {
        return promise.thenAgain(f)
    }

    this.terminate = (val) => {
        queue = queue.then(() => {
            return promise.terminate(val)
        })
    }

}





module.exports = {
    Defer,
    Cycle,
}

