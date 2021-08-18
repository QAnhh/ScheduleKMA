'use strict';

const utils = require("../utils.js");
const md5 = require("md5");
const axios = require("axios").default;
const cheerio = require("cheerio");
const qs = require("query-string");
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');

axiosCookieJarSupport(axios);
const cookieJar = new tough.CookieJar();

module.exports = async (username, password, config) => {
	let url = config.HOST_API + "/CMCSoft.IU.Web.Info/Login.aspx"

	axios.defaults.jar = cookieJar;
	axios.defaults.withCredentials = true;
	axios.defaults.crossdomain = true;

	const formData = {
		txtUserName: username,
		txtPassword: md5(password),
		btnSubmit: 'Đăng nhập',
		__EVENTTARGET: ''
	};

	const form = qs.stringify(formData)

	try {
		let res = await axios.post(url, form, {
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/76.0.114 Chrome/70.0.3538.114 Safari/537.36",
				"Content-Type": "application/x-www-form-urlencoded"
			},
		})

		const $ = cheerio.load(res.data)
		const userFullName = $('#PageHeader1_lblUserFullName').text().toLowerCase()
		const wrongPass = $('#lblErrorInfo').text()

		let re = {}

		if (wrongPass == 'Bạn đã nhập sai tên hoặc mật khẩu!' || wrongPass == 'Tên đăng nhập không đúng!') {
			re = {
				code: 400,
				message: 'Sai tên đăng nhập hoặc mật khẩu'
			}
		} else {

			if (userFullName != 'khách') {
				re = {
					code: 200,
					message: 'Đăng nhập thành công !',
					cookie: cookieJar
				}
			} else {
				re = {
					code: 400,
					message: 'Vui lòng đăng nhập lại !',
					cookie: cookieJar
				}
			}
		}
		
		return Promise.resolve(re)
	} catch (err) {
		return Promise.reject({
			code: 500,
			message: err
		})
	}

}