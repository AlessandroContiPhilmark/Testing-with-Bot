var tagHolder = {};

function listenPromise(tag){
    return new Promise( (resolve, reject) => {
        if( tagHolder[tag] ){
            tagHolder[tag].resolve.push(resolve);
            tagHolder[tag].reject.push(reject);
        } else resolve();
    });
}
function firePromise(tag, {params, error} = {} ){
    if( tagHolder[tag] ) {
        if( error ) tagHolder[tag].reject.forEach(fun => fun(error));
        else        tagHolder[tag].resolve.forEach(fun => fun(params));
        delete tagHolder[tag];
    }
}
function enableTagPromise(tag){
    if( !tagHolder[tag] ) tagHolder[tag] = { resolve: [], reject: [] };
}

module.exports = {
	listenPromise,
	firePromise,
	enableTagPromise
};