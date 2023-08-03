const shadowContainer = document.getElementById("shadow")
const shadowRoot = shadowContainer.attachShadow({ mode: "open" })
async function loadHTMLAndCreateShadowDOM() {
	try {
		// Загружаем файлы CSS и JS с помощью Fetch API
		const cssResponse = await fetch("./main.min.css")
		const cssContent = await cssResponse.text()

		const jsResponse = await fetch("./app.js")
		const jsContent = await jsResponse.text()

		// Создаем контейнер для содержимого и добавляем в него контент
		const contentContainer = document.createElement("div")
		contentContainer.id = "app"

		// Создаем элемент <style> для добавления стилей в Shadow DOM
		const styleElement = document.createElement("style")
		styleElement.textContent = cssContent

		// Создаем элемент <script> для добавления JS-кода в Shadow DOM
		const scriptElement = document.createElement("script")
		scriptElement.textContent = jsContent

		// Добавляем контент, стили и скрипты в Shadow DOM
		shadowRoot.appendChild(contentContainer)
		shadowRoot.appendChild(styleElement)
		shadowRoot.appendChild(scriptElement)
		start()
	} catch (error) {
		console.error("Ошибка при загрузке файлов:", error)
	}
}
loadHTMLAndCreateShadowDOM()

function start() {
	let token_access
	const intervalIds = []
	const default_lang = 'in'
	const langData = {
		ru: {
			currency: {
				currency_value: 'RUB',
				currency_symbol: '₽',
				currency_minsum: 500,
				currency_maxSum: 2000000,
			},
			payment_methods: [
				{ payment_value: 'СБП', payment_img: './img/╤Б╨▒╨┐.png', payment_desc: 'По номеру телефона в любой банк', checked: true },
				{ payment_value: 'Тинькофф', payment_img: './img/╤В╨╕╨╜╤М╨║╨╛╤Д╤Д.png', payment_desc: 'По номеру карты' },
				{ payment_value: 'Сбербанк', payment_img: './img/╤Б╨▒╨╡╤А╨▒╨░╨╜╨║.png', payment_desc: 'По номеру карты' },
			],
			default_method: 'СБП',
			default_pan: '',
			default_seller: 'Инга Васильева',
		},
		en: {
			currency: {
				currency_value: 'USD',
				currency_symbol: '$',
				currency_minsum: 10,
				currency_maxSum: 5000,
			}
		},
		in: {
			currency: {
				currency_value: 'INR',
				currency_symbol: '₹',
				currency_minsum: 500,
				currency_maxSum: 80000,
			},
			payment_methods: [
				{ payment_value: 'UPI', payment_img: './img/UPI.svg', payment_desc: 'via card number', checked: true },
				{ payment_value: 'Paytm', payment_img: './img/Paytm.svg', payment_desc: 'via card number' },
				{ payment_value: 'PhonePe', payment_img: './img/PhonePe.svg', payment_desc: 'via card number' },
				{ payment_value: 'GPay', payment_img: './img/GPay.svg', payment_desc: 'via card number' }
			],
			default_pan: '+91 *** *** 210',
			default_method: 'UPI',
			default_seller: 'Siddnesh anil',
		},
	}

	let store = JSON.parse(localStorage.getItem('store'))
	let pan
	function createDefaultValues() {
		return {
			id: '',
			lang: default_lang,
			currency: langData[default_lang].currency,
			method: langData[default_lang].default_method,
			amount: '',
			step: 1,
			pan: pan,
			seller: langData[default_lang].default_seller,
			status: null,
			timer: {
				minutes: 1,
				seconds: 0,
			},
			isActive: false,
			utr: '',
		}
	}
	if (langData[default_lang].default_method === 'СБП' && default_lang === 'ru') {
		pan = '+7 960 *** ** 76'
	} else if (!langData[default_lang].default_method === 'СБП' && default_lang === 'ru') {
		pan = '3435 45** **** 2325'
	} else {
		pan = langData[default_lang].default_pan
	}

	if (!store) {
		store = createDefaultValues()
		localStorage.setItem('store', JSON.stringify(store))
	}
	if (langData[store.lang].currency.currency_value === 'RUB') {
		token_access = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJFeHBpcmVzQXQiOjE2OTgwNDg4MzYsIklEIjoiMGJmMjRiNWYtMGVhOS00ZTA3LTgyMzktYTYzN2JlYmI3ODUxIiwiSXNzdWVkQXQiOjE2ODI0OTY4MzYsIklzc3VlciI6Ik5lcGF2ZWwiLCJOb3RCZWZvcmUiOjE2ODI0OTY4MzYsIlJvbGUiOiJtZXJjaGFudCIsIlN1YmplY3QiOiJjcnlwdG9BY2NydWluZyIsImtleSI6IkUyTnpReU5qZzVNamNzSWtsRUlqbyJ9.wMiSvikgFcLCfpvlIcCu3wt8xBjbVmoiJygU9W3wD-g'
	} else if (langData[store.lang].currency.currency_value === 'INR') {
		token_access = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJFeHBpcmVzQXQiOjE3MDY2MTE2MzAsIklEIjoiYjE2NjkyNzYtNTY5YS00MjI5LWI5NDAtZjQ5ODk1YTUzYzlhIiwiSXNzdWVkQXQiOjE2OTEwNTk2MzAsIklzc3VlciI6ImRldl9JTlIiLCJOb3RCZWZvcmUiOjE2OTEwNTk2MzAsIlJvbGUiOiJtZXJjaGFudCIsIlN1YmplY3QiOiJjcnlwdG9BY2NydWluZyIsImtleSI6IkUyTnpReU5qZzVNamNzSWtsRUlqbyJ9.ig2YaYylGrTpW5nX566iJrcIhjbbcx1Fsm8FCNSVFHg'
	}

	const storedAmount = Number(store.amount)

	//Логика переводов
	async function t(key) {
		try {
			const lang = store.lang
			const response = await fetch(`locations/${lang}.json`)
			const translations = await response.json()
			return translations[key] || key
		} catch (error) {
			console.error(`Failed to load translations for ${lang}:`, error)
			return key
		}
	}

	function createPaymentMethods(t) {
		const currentLangMethods = langData[store.lang].payment_methods

		return currentLangMethods.map((method) => `
    <div style="width: 100%; margin-top: 10px; margin-bottom: 10px;">
      <label class='home-label'>
        <input
					${method.checked ? 'checked' : null}
          class='home-inp'
          type="radio"
          name="method"
          value="${method.payment_value}"
          ${store.method === method.payment_value ? 'checked' : ''}
        />
        <div><img class='home-icon' src="${method.payment_img}" alt="" /></div>
        <span class="main-name">${method.payment_desc}</span>
      </label>
    </div>
  `).join('')
	}

	async function loadTranslations() {
		const appElement = shadowRoot.querySelector('#app')
		const translations = await fetch(`locations/${store.lang}.json`).then(response => response.json())
		const t = (key) => translations[key] || key
		const paymentMethodsHtml = createPaymentMethods(t)

		function switchStep(step) {
			if (step === 1) {
				step1()
			} else if (step === 2) {
				step2()
			} else if (step === 3) {
				step3()
			}
		}

		switchStep(store.step)

		function formatNumberWithSpaceSeparator(value) {
			return new Intl.NumberFormat('ru-RU').format(value)
		}


		function step1() {
			clearAllIntervals()
			let formattedAmount = ''
			appElement.innerHTML = `
			<select name="" id="land-s">
			<option value="#">Дефолтное</option>
			<option value="ru">Россия</option>
			<option value="in">Индия</option>
		</select>
    <section class="main">
      <div class="wrapper">
        <div class="main-top">
          <div class='home-title'>
            <h1 class="main-title">${t('tryPaymentSystem')}</h1>
            <span class='home-garant'>
              <img class='home-garant-icon' src='./img/success.svg' alt="success" />
              ${t('guarantee')}
            </span>
          </div>
          <p class='home-desc'>${t('paymentStepDescription')}</p>
        </div>
        <form action="">
          <div style={radioContainer}>
            ${paymentMethodsHtml}
          </div>
          <div style='margin-top: 40px; position: relative;'  class="main-form">
            <span class="main-label">${t('sum')}</span>
            <div class="main-input">
							<input class="input-amount" type="text" value="${formattedAmount}" />
              <span>${store.currency.currency_symbol}</span>
            </div>
						<div id='message' class='message-not'></div>
            <button
              disabled
							id='btn-amount'
              class="primary-btn primary-btn-big">
              ${t('payBtn')}
            </button>
          </div>
        </form>
      </div>
  </section>
  `

			const inputAmount = shadowRoot.querySelector('.input-amount')
			const btnAmount = shadowRoot.getElementById('btn-amount')
			const message = shadowRoot.getElementById('message')

			inputAmount.addEventListener('input', function (event) {
				let inputValue = event.target.value.replace(/\D+/g, '')
				store.amount = inputValue
				localStorage.setItem('store', JSON.stringify(store))

				formattedAmount = inputValue ? formatNumberWithSpaceSeparator(inputValue) : ''
				inputAmount.value = formattedAmount
				toggleAttributes(store.amount, btnAmount, 'disabled')
			})

			toggleAttributes(store.amount, btnAmount, 'disabled')
			formattedAmount = store.amount ? formatNumberWithSpaceSeparator(store.amount) : ''
			inputAmount.value = formattedAmount

			//Отслеживаем клик на кнопку и проверяем диапазоны сумм. Если ок, переходим на шаг 2
			btnAmount.addEventListener('click', (e) => {
				e.preventDefault()
				if (+store.amount < langData[store.lang].currency.currency_minsum) {
					message.innerText = `${t('inCorrectAmount')} ${langData[store.lang].currency.currency_minsum} ${langData[store.lang].currency.currency_symbol}`
					message.classList.add('error')
					visibleMessage(message)
				} else if (+store.amount > langData[store.lang].currency.currency_maxSum) {
					message.innerText = `${t('inCorrectAmountMax')} ${langData[store.lang].currency.currency_maxSum} ${langData[store.lang].currency.currency_symbol}`
					message.classList.add('error')
					visibleMessage(message)
				}
				else {
					store.step = 2
					localStorage.setItem('store', JSON.stringify(store))
					switchStep(2)
					loadTranslations()
				}
			})

			//Записываем в localstorage и делаем активным выбранный метод оплаты
			function handlePaymentMethodChange(event) {
				if (store.lang === 'ru') {
					if (event.target.value === 'СБП') {
						store.pan = '+7 960 *** ** 76'
						localStorage.setItem('store', JSON.stringify(store))
					} else {
						store.pan = '3435 45** **** 2325'
						localStorage.setItem('store', JSON.stringify(store))
					}
				}
				const selectedMethod = event.target.value
				store.method = selectedMethod
				localStorage.setItem('store', JSON.stringify(store))
			}

			//Отслеживаем изменение выбранного метода и вызываем функцию handlePaymentMethodChange
			const paymentMethodInputs = shadowRoot.querySelectorAll('.home-inp')
			paymentMethodInputs.forEach(input => {
				input.addEventListener('change', handlePaymentMethodChange)
			})
		}

		function step2() {
			appElement.innerHTML = `
		<section class="main">
		<div class="wrapper">
		${store.id
					? `
					<div class="main-pl">
						<span class="main-pl-txt">${t('paymentID')}</span>
						<div class="main-copy">
							<span style='position: relative;' class="main-block-copy">
								<span class='pay-id'>${store.id}</span>
								<i data-copy-text="${store.id}" class="copy-button copy-ico"></i>
							</span>
						</div>
					</div>
				`
					: ''
				}
			<div class="main-block">
				<span class="main-block-tit">${t('requisitesPayment')}</span>
				<div>
					<span style='position: relative;' class="main-block-copy">
						<span>${store.pan}</span>
						<i data-copy-text="${store.pan}" class="copy-button copy-ico copy-ico-big"></i>
					</span>
				</div>
				<span class="main-block-txt">
					<div>${store.method}</div>
					<div>${t('seller')}: ${store.seller}</div>
				</span>
			</div>
			<div class="main-block">
				<span class="main-block-tit">${t('transferAmount')}</span>
				<div style='position: relative;' class="main-block-copy">
					<span style='display: flex; align-items: center'>
						<span>${formatNumberWithSpaceSeparator(store.amount)}</span>
						<span class='pay-2-currency'>
							${langData[store.lang].currency.currency_symbol}
						</span>
					</span>
					<span style='position: relative;' class="main-block-copy">
						<i data-copy-text="${store.amount}" class="copy-button copy-ico copy-ico-big"></i>
					</span>
				</div>
				${store.lang === 'in' && store.isActive
					? `
					<div class='utr-block'>
					<span class="main-label">${t('utrNumber')}</span>
					<div class="main-input">
						<input
							id='input-utr'
							type='number'
							value=${store.utr}
						/>
					</div>
				</div>
					`
					: ''
				}
			</div>
			<div class="main-wrap">
			<span class="main-wrap-tit">
				${t('getTransferIn')} <span id="timerTextField">${store.isActive ? `${String(store.timer.minutes).padStart(2, '0')}:${String(store.timer.seconds).padStart(2, '0')}` : '10:00'}</span>
			</span>
				<p>${t('dontTransfer')}</p>
				<p>
					${t('transferExactly')}
					<span style='margin-left: 3px; font-size: 19px'>
						<span>${formatNumberWithSpaceSeparator(store.amount)}</span>
						${langData[store.lang].currency.currency_symbol}
					</span>
					<span style='margin-left: 5px;'>${t('clickButton')}	</span>
					${t('paid')}
				</p>
			</div>
			<div style='position: relative;' class="buttons">
				<button
					id='btnCreatePay'
					class='primary-btn'
				>
				${t('confirmPaid')}
				</button>
				<div id='create-message' style='margin-top: 10px; margin-left: 10px; font-size: 20px' class='message error'></div>
				<div class="buttons-group">
					<button
						disabled
						id='btnConfirmPay'
						class='primary-btn'
					>
						${t('paid')}
					</button>
					<button class='link'
						id='btnCancelPay'
					>
						${t('cancelPaid')}
					</button>
				</div>
			</div>
			<div class="main-bottom">
				<p>${t('help')}</p>
				<a href="#" class="main-tg">@paymatrix_support</a>
			</div>
		</div>
	</section>
`
			const btnCreatePay = shadowRoot.getElementById('btnCreatePay')
			const btnConfirmPay = shadowRoot.getElementById('btnConfirmPay')
			if (store.isActive && store.lang === 'in') {
				const inputUtr = shadowRoot.getElementById('input-utr')
				inputUtr.addEventListener('input', (e) => {
					const utrValue = e.target.value
					store.utr = utrValue
					localStorage.setItem('store', JSON.stringify(store))
					if (utrValue) {
						btnConfirmPay.removeAttribute('disabled', '')
					} else {
						btnConfirmPay.setAttribute('disabled', '')
					}
				})
			}
			btnCreatePay.addEventListener('click', async (e) => {
				let data
				e.preventDefault()
				try {
					let method = store.method
					if (store.lang === 'ru') {
						if (store.method === 'СБП') method = 'SBP'
						if (store.method === 'Тинькофф') method = 'Tinkoff'
						if (store.method === 'Сбербанк') method = 'Sber'
						data = await createPay(+store.amount, store.currency.currency_value, 'USDT', method, 'TEST DEVELOPER')
					} else {
						data = await createPay(+store.amount, store.currency.currency_value, 'USDT', method, 'TEST DEVELOPER')
					}
					if (data.Code) {
						shadowRoot.getElementById('create-message').innerHTML = `${t('badRequestOrNotClient')}`
						visibleMessage(shadowRoot.getElementById('create-message'))
					} else {
						const creditCardRegex = /^\d{4}( ?\d{4}){3}$/
						const phoneNumberRegex = /^\+?\d+$/
						const response = data.pan
						if (creditCardRegex.test(response)) {
							store.pan = data.pan
						} else if (phoneNumberRegex.test(response)) {
							store.pan = formatPhoneNumber(response)
						} else {
							store.pan = data.pan
						}
						btnConfirmPay.removeAttribute('disabled', '')
						store.seller = data.seller_name,
							store.id = data.id,
							store.status = data.status,
							store.isActive = true,
							localStorage.setItem('store', JSON.stringify(store))
						switchStep(2)
						loadTranslations()
					}
				} catch (error) {
					console.error('Ошибка при создании платежа:', error)
				}
			})

			if (store.isActive) {
				btnCreatePay.setAttribute('disabled', '')
				startTimer()
				if (store.utr && store.lang === 'in') {
					btnConfirmPay.removeAttribute('disabled', '')
				} else if (!store.utr && store.lang === 'in') {
					btnConfirmPay.setAttribute('disabled', '')
				} else {
					btnConfirmPay.removeAttribute('disabled', '')
				}
			} else {
				btnConfirmPay.setAttribute('disabled', '')
			}

			const createPay = async (amount, currency_code, crypto_currency_code, payment_method, card_holder) => {
				const url = 'https://cryptoacquiring.paymatrix.ru/api/trades/make'
				try {
					const response = await fetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'token_access': token_access
						},
						body: JSON.stringify({
							amount,
							currency_code,
							crypto_currency_code,
							payment_method,
							card_holder
						}),
					})

					const data = await response.json()
					return data
				} catch (e) {
					console.log(e)
					throw new Error(e.message)
				}
			}

			btnConfirmPay.addEventListener('click', async () => {
				const data = await confirmPay()
				if (data.Code) {
					console.log(data.Message)
				} else {
					store.step = 3
					localStorage.setItem('store', JSON.stringify(store))
					switchStep(3)
					loadTranslations()
				}
			})

			async function confirmPay() {
				let url
				if (store.lang !== 'ru') {
					url = `https://cryptoacquiring.paymatrix.ru/api/trades/${store.id}/utr`
				} else {
					url = `https://cryptoacquiring.paymatrix.ru/api/trades/${store.id}/confirm`
				}
				try {
					const headers = {
						'Content-Type': 'application/json',
						'token_access': token_access
					}

					let body

					if (store.lang === 'in') {
						body = JSON.stringify({
							utr: store.utr
						})
						const response = await fetch(url, {
							method: 'POST',
							headers: headers,
							body: body
						})
						const data = await response.json()
						return data
					} else {
						const response = await fetch(url, {
							method: 'POST',
							headers: headers,
						})
						const data = await response.json()
						return data
					}
				} catch (error) {
					console.error('Error:', error)
				}
			}


			function startTimer() {
				const intervalId = setInterval(handleIntervalTick, 1000)
				intervalIds.push(intervalId)

				let minutes = store.timer.minutes
				let seconds = store.timer.seconds

				function updateTimerText(minutes, seconds) {
					const timerTextField = shadowRoot.getElementById('timerTextField')
					timerTextField.innerHTML = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
				}

				const storedData = JSON.parse(localStorage.getItem('store'))
				if (storedData && storedData.timer && storedData.timer.minutes && storedData.timer.seconds) {
					minutes = parseInt(storedData.timer.minutes, 10)
					seconds = parseInt(storedData.timer.seconds, 10)
					store.timer.minutes = minutes
					store.timer.seconds = seconds
				} else {
					store.timer.minutes = minutes
					store.timer.seconds = seconds
					localStorage.setItem('store', JSON.stringify(store))
				}

				updateTimerText(minutes, seconds)

				function handleIntervalTick() {
					if (!store.isActive) {
						clearInterval(intervalId)
					} else {
						if (seconds === 0) {
							if (minutes === 0) {
								clearInterval(intervalId)
								cancelPay()
								store = createDefaultValues()
								localStorage.setItem('store', JSON.stringify(store))
								loadTranslations()
								return
							} else {
								minutes--
								seconds = 59
							}
						} else {
							seconds--
						}
					}
					store.timer.minutes = minutes
					store.timer.seconds = seconds
					localStorage.setItem('store', JSON.stringify(store))
					updateTimerText(minutes, seconds)
				}

				return intervalId
			}
		}

		function step3() {
			const checkPayStatus = async () => {
				try {
					const data = await getPayInfo()
					if (data.Code) {
						console.log(data.Message)
					} else {
						store.status = data
						console.log(store.status)
						localStorage.setItem('store', JSON.stringify(store))
						loadTranslations()
					}
				} catch (error) {
					console.error('Error fetching pay info:', error)
				}
			}
			clearAllIntervals()
			const intervalId = setInterval(checkPayStatus, 5000)
			intervalIds.push(intervalId)

			if (store.status === 'paid' || store.status === 'opened') {
				appElement.innerHTML = checkPay()
			} else if (
				store.status === 'cancelled user' ||
				store.status === 'cancelled trader' ||
				store.status === 'cancelled timeout'
			) {
				clearInterval(intervalId)
				appElement.innerHTML = errorPay()
			} else if (store.status === 'closed') {
				clearInterval(intervalId)
				appElement.innerHTML = successfullyPay()
			}

			function checkPay() {
				return `
			<div style='padding: 50px' class="wrapper">
				<div class="main-pl">
					<span class="main-pl-txt">${t('paymentID')}</span>
					<div class="main-copy">
						<span style='position: relative;' class="main-block-copy">
							<span class='pay-id'>${store.id}</span>
							<i data-copy-text="${store.id}" class="copy-button copy-ico"></i>
						</span>
					</div>
				</div>
				<div class="main-expectation">
					<h1 class="main-title">${t('check')}</h1>
					<span style='margin-bottom: 20px; font-size: 23px; display: block' class="main-time">
						${t('checkPayMinut')}
					</span>
				</div>
				<div class="main-wrap main-wrap-second">
					<div class="payment">
						<ul>
							<li>
								<span>${t('paymentSystem')}</span>
								<b>${store.method}</b>
							</li>
							<li>
								<span>${t('lastSum')}</span>
								<b class='check-amount'>
									<span>${formatNumberWithSpaceSeparator(store.amount)}</span>
									<span class='currency-symbol'>
										${langData[store.lang].currency.currency_symbol}
									</span>
								</b>
							</li>
							<li>
								<span>${t('lastRequisites')}</span>
								<b>${store.pan} <i>${store.seller}</i></b>
							</li>
						</ul>
					</div>
				</div>
				<div class="main-bl">
					<span class="main-bl-tit">${t('dontCloseWindow')}</span>
					<button 
						class='second-btn second-btn-small'
						id='btnCancelPay'
					>
						${t('cancelPaid')}
					</button>
				</div>
				<div class="main-bottom">
					<p>${t('help')}</p>
					<a href="#" class="main-tg">@paymatrix_support</a>
				</div>
			</div>
			`
			}

			function errorPay() {
				return `
			<section class="main">
			<div class="wrapper wrapper-second">
				<div class="main-pl">
					<span class="main-pl-txt">${t('paymentID')}</span>
					<div class="main-copy">
						<span style='position: relative;' class="main-block-copy">
							<span class='pay-id'>${store.id}</span>
							<i data-copy-text="${store.id}" class="copy-button copy-ico"></i>
						</span>
					</div>
				</div>
				<div class="main-payment main-payment-second">
					<i class="main-payment-ico"><img src='./img/vaadin_close-small.svg' alt="" /></i>
					<div class="main-payment-wrap">
						<h1 class="main-title">${t('errorPay')}</h1>
						<h1 style='font-size: 20px' class="main-subtitle">${t('writeToHelp')}</h1>
						<div style='margin-bottom: 50px' class="payment">
							<ul style='margin-top: 30px'>
								<li>
									<span>${t('paymentSystem')}</span>
									<b>${store.method}</b>
								</li>
								<li>
									<span>${t('lastSum')}</span>
									<b class='check-amount'>
										<span>${formatNumberWithSpaceSeparator(store.amount)}</span>
										<div>
											<span class='currency-symbol'>
												${langData[store.lang].currency.currency_symbol}
											</span>
										</div>
									</b>
								</li>
								<li>
									<span>${t('lastRequisites')}</span>
									<b>${store.pan} <i>${store.seller}</i></b>
								</li>
							</ul>
						</div>
						<button
							id='btnNewPay'
							style='display: flex; margin: 0 auto; justify-content: center' 
							class="primary-btn primary-btn-big">
							${t('reloadPay')}
						</button>
					</div>
				</div>
				<div class="main-bottom main-bottom-second">
					<p>${t('help')}</p>
					<a href="#" class="main-tg">@paymatrix_support</a>
				</div>
			</div>
		</section>
        `
			}

			function successfullyPay() {
				return `
			<section class="main">
			<div class="wrapper wrapper-second">
				<div class="main-pl">
					<span class="main-pl-txt">${t('paymentID')}</span>
					<div class="main-copy">
						<span style='position: relative' class="main-block-copy">
							<span class='pay-id'>${store.id}</span>
							<i data-copy-text="${store.id}" class="copy-button copy-ico"></i>
						</span>
					</div>
				</div>
				<div class="main-payment">
					<i class="main-payment-ico"><img src='./img/fe_check.svg' alt="" /></i>
					<div class="main-payment-wrap">
						<h1 class="main-title">${t('successfully')}</h1>
						<div style='margin-bottom: 50px' class="payment">
							<ul>
								<li>
									<span>${t('paymentSystem')}</span>
									<b>${store.method}</b>
								</li>
								<li>
									<span>${t('lastSum')}</span>
									<b class='check-amount'>
										<span>${formatNumberWithSpaceSeparator(store.amount)}</span>
										<div>
											<span class='currency-symbol'>
												${langData[store.lang].currency.currency_symbol}
											</span>
										</div>
									</b>
								</li>
								<li>
									<span>${t('lastRequisites')}</span>
									<b>${store.pan} <i>${store.seller}</i></b>
								</li>
							</ul>
						</div>
						<button
							id='btnNewPay'
							style='display: flex; margin: 0 auto; justify-content: center' 
							class="primary-btn primary-btn-big">
							${t('newPay')}
						</button>
					</div>
				</div>
				<div class="main-bottom main-bottom-second">
					<p>${t('help')}</p>
					<a href="#" class="main-tg">@paymatrix_support</a>
				</div>
			</div>
		</section>
        `
			}
		}


		async function cancelPay() {
			clearAllIntervals()
			if (!store.isActive) {
				store = createDefaultValues()
				localStorage.setItem('store', JSON.stringify(store))
				switchStep(1)
			} else {
				const url = `https://cryptoacquiring.paymatrix.ru/api/trades/${store.id}/cancel`
				try {
					const response = await fetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'token_access': token_access,
						},
					})

					const data = await response.json()
					return data
				} catch (error) {
					console.error('Error:', error)
				}
			}
		}

		async function getPayInfo() {
			const url = `https://cryptoacquiring.paymatrix.ru/api/trades/${store.id}`

			try {
				const response = await fetch(url, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'token_access': token_access,
					},
				})

				const data = await response.json()
				return data.status
			} catch (error) {
				console.error('Error:', error)
			}
		}


		function visibleMessage(message) {
			setTimeout(() => {
				message.innerHTML = ''
			}, 3000)
		}

		function copyToClipboard(text, button) {
			console.log(text)
			navigator.clipboard.writeText(text)
				.then(() => {
					showCopiedMessage(button, 'successCopy', shadowRoot)
				})
				.catch((error) => {
					console.error('Failed to copy text to clipboard:', error)
					showCopiedMessage(button, 'errorCopy', shadowRoot)
				})
		}

		function handleCopyButtonClick(event) {
			const button = event.target
			const textToCopy = button.dataset.copyText

			if (textToCopy) {
				copyToClipboard(textToCopy, button) // Передаем button в функцию copyToClipboard()
			} else {
				showCopiedMessage(button, 'errorCopy', shadowRoot)
			}
		}

		function showCopiedMessage(button, status, shadowRoot) {
			const message = document.createElement('span')
			message.innerText = `${t('successfullyCopied')}`
			message.classList = `copy-message message-not ${status}`

			const parentElement = button.parentElement
			parentElement.appendChild(message)

			setTimeout(() => {
				parentElement.removeChild(message)
			}, 2000)
		}

		function toggleAttributes(elemChecked, elemAtr, atrValue) {
			if (elemChecked) {
				elemAtr.removeAttribute(atrValue, '')
			} else {
				elemAtr.setAttribute(atrValue, '')
			}
		}

		shadowRoot.getElementById('land-s').addEventListener('change', (e) => {
			store.lang = e.target.value
			store.currency = langData[store.lang].currency
			localStorage.setItem('store', JSON.stringify(store))
			loadTranslations()
		})

		const copyButtons = shadowRoot.querySelectorAll('.copy-button')
		copyButtons.forEach((button) => {
			button.addEventListener('click', handleCopyButtonClick)
		})


		const btnCancelPay = shadowRoot.querySelectorAll('#btnCancelPay')
		btnCancelPay.forEach(item => {
			item.addEventListener('click', async (e) => {
				e.preventDefault()
				const data = await cancelPay()
				if (data) {
					console.log(data)
					store = createDefaultValues()
					loadTranslations()
					localStorage.setItem('store', JSON.stringify(store))
				} else {
					store = createDefaultValues()
					loadTranslations()
					localStorage.setItem('store', JSON.stringify(store))
				}
			})
		})

		shadowRoot.querySelectorAll('#btnNewPay').forEach(btn => {
			btn.addEventListener('click', () => {
				store = createDefaultValues()
				localStorage.setItem('store', JSON.stringify(store))
				loadTranslations()
			})
		})

	}

	function clearAllIntervals() {
		intervalIds.forEach((id) => clearInterval(id))
		intervalIds.length = 0
	}
	loadTranslations()


	function formatPhoneNumber(phoneNumber) {
		const parsedPhoneNumber = libphonenumber.parsePhoneNumberFromString(phoneNumber, store.lang.toUpperCase())
		return parsedPhoneNumber.formatInternational()
	}
}