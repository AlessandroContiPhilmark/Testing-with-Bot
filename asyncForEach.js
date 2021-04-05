Array.prototype.asyncForEach = async function (callback, asyncCallback = exports.asyncCallback) {
	if (asyncCallback) {
		for (var index = 0; index < this.length; index++) await callback(this[index], index);
	} else return new Promise(res => {
		var executions = this.length
		if (executions == 0) res();
		this.forEach(async (elem, index) => {
			await callback(elem, index);
			if (executions-- == 1) res();
		})
	})
}
exports.asyncCallback = false;