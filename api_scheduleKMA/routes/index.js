var express = require('express');
var router = express.Router();
const axios = require('axios').default;
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');
const md5 = require('md5');
const qs = require('query-string');
const cheerio = require('cheerio');
const {parseInitialFormData, parseSelector} = require('../utils');
const { handleExcel } = require('../module/handleExcel');

const loginUrl = "http://qldt.actvn.edu.vn/CMCSoft.IU.Web.Info/Login.aspx";
const scheduleUrl = "http://qldt.actvn.edu.vn/CMCSoft.IU.Web.Info/Reports/Form/StudentTimeTable.aspx";

axiosCookieJarSupport(axios);
const cookieJar = new tough.CookieJar();

axios.defaults.withCredentials = true;
axios.defaults.crossdomain = true;
axios.defaults.jar = cookieJar;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.post('/',async  (req, res) => {
  	var username = req.body.username;
  	var password = req.body.password;
  	if(username==''||password=='')
  		return res.send("chưa nhập đủ thông tin!");
  	const config = {
  		headers: {
  			'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/76.0.114 Chrome/70.0.3538.114 Safari/537.36',
  			'Content-Type': 'application/x-www-form-urlencoded'
  		},
  		withCredentials: true,
  		jar: cookieJar
  	}
  	try {
  		let getData = await axios.get(loginUrl,config);
	  	let $ = cheerio.load(getData.data);

	  	const formData = {
	  		...parseInitialFormData($),
	  		...parseSelector($),
	  		txtUserName: username,
	  		txtPassword: md5(password),
	  		btnSubmit: 'Đăng nhập'
	  	}
	  	let formDataQS = qs.stringify(formData);
	  	let postData = await axios.post(loginUrl,formDataQS,config);
	  	$ = cheerio.load(postData.data);
	  	const userFullName = $('#PageHeader1_lblUserFullName').text().toLowerCase();
	  	const wrong = $('#lblErrorInfo').text();
	  	
	  	if(wrong == 'Tên đăng nhập không đúng!'||wrong == 'Bạn đã nhập sai tên hoặc mật khẩu!'){
	  		return res.send('sai tài khoản hoặc mật khẩu!');
	  	}
	  	if(userFullName=='khách'){
	  		return res.send('login lỗi');
	  	}

	  	let getSchedule = await axios.get(scheduleUrl,config);
	  	$ = cheerio.load(getSchedule.data);
	  	let selecterData = parseSelector($);
	  	selecterData.drpSemester = "2785c57c8f50480b91437980bb75f7ed";
	  	selecterData.drpTerm = 1;
	  	selecterData.Type = 'B';
	  	selecterData.btnView = "Xuất file Excel";
	  	let formDataSchedule = {
	  		...parseInitialFormData($),
	  		...selecterData,
	  	}
	  	let formDataScheduleQS = qs.stringify(formDataSchedule);
	  	let postSchedule = await axios.post(scheduleUrl,formDataScheduleQS,{
	  		headers: {
	  			'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/76.0.114 Chrome/70.0.3538.114 Safari/537.36',
	  			'Content-Type': 'application/x-www-form-urlencoded',
	  			'Accept': 'text/html,application/xhtml+xml,application/xml,application/vnd.ms-excel;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
  			},
  			responseType: 'arraybuffer',
	  	});
	  	const schedule = handleExcel(postSchedule.data);
	  	//return res.status(200).json(schedule);
	  	res.render('home',{ data: JSON.stringify(schedule) });
	  	//res.end(postSchedule.data)
  	} catch(e) {
  		console.log(e);

  	}

});
module.exports = router;