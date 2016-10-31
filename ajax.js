return {
			/**
			* Perform a custom ajax call
			*
			* @param {String} url - Url to call, will default to models url
			* @param {String} method - put, post, fetch, destroy
			* @param {Object} [data] - Data to send
			* @param {Function} [callback] - success, complete, error - NOTE: implementing these will override the default deferred resolves
			*/
			ajax(url, method = 'fetch', data = {}, callback = {}) {
				let argOne
				let argTwo

				method = method.toLowerCase() // saftey

				if (url) {
					if (url.slice(0, 7) === 'http://') {
						this.url = url
					} else {
						this.url = App.API + url
					}

					// console.log('this.url', this.url);
				}

				return new Promise((resolve, reject) => {
					let newCallback = {
						success: (object, result) => {
							// noResetUrl is used for collections who need to paginate
							// who set the url via the first arg above.
							// if we reset the url after, then the pagination might not be consistent
							if (this.resetUrl && !this.noResetUrl) {
								this.resetUrl();
							}

							if (callback.success) {
								callback.success(object, result)
							}

							resolve(this)
						},
						error(object, error) {
							if (callback.error) {
								callback.error(object, error)
							}

							reject(error, object)
						}
					};

					argOne = newCallback

					if (_.contains(['put', 'post'], method)) {
						let isNew = method === 'post' // declare outside, so we can use in isNew after method is changed
						method = 'save'
						argOne = data || null
						argTwo = newCallback

						this.isNew = function() {
							return isNew; // this makes it PUT for put's
						};
					}

					if (_.contains(['delete', 'remove', 'destroy'], method)) {
						this.isNew = function() {
							return false; // force PUT
						};

						method = 'destroy'
					}

					if (!this[method]) {
						App.log('Error - cannot find method in quickcall:', method, this.contextName, 1);
						reject()
					}

					let valid = this[method](argOne, argTwo)

					if (!valid) {
						// console.log('Validation failed', this);

						reject({
							errors: this.validationError,
							message: 'Validation failed',
						})
					}
				});
			},
}
