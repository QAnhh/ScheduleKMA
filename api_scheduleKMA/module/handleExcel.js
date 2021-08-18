const fs = require('fs');
const XLSX = require('xlsx');
const dayjs = require('dayjs');
var customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

module.exports = {
	handleExcel: (excelBuffer) => {
		var workbook = XLSX.read(excelBuffer, {
			type: 'buffer',
		});
		var worksheet = workbook.Sheets[workbook.SheetNames[0]];
		var jsonData = XLSX.utils.sheet_to_json(worksheet);

		let schedule = [];

		let lessonArray = (lesson) => {
			let lesson_array_new = [];
			let lesson_array = [
				'1,2,3',
				'4,5,6',
				'7,8,9',
				'10,11,12',
				'13,14,15,16',
			];
			for (let i = 0; i < lesson_array.length; i++) {
				if (lesson.indexOf(lesson_array[i]) != -1) {
					lesson_array_new.push(lesson_array[i]);
				}
			}
			return lesson_array_new;
		};

		let findDatewithDay = (start_date, end_date, day) => {
			let dateList = [];

			const startDateUnix = dayjs(start_date, 'DD/MM/YYYY').unix();
			const endDateUnix = dayjs(end_date, 'DD/MM/YYYY').unix();

			for (let i = startDateUnix; i < endDateUnix; i += 60 * 60 * 24) {
				let date = dayjs.unix(i);

				if (day == date.day() + 1) {
					dateList.push(date.format('DD/MM/YYYY'));
				}
			}
			return dateList;
		};

		let handleClass = (start_date, end_date, subject_name, str) => {
			str = str.split('\n');
			for (let i = 0; i < str.length; i++) {
				if (str[i] != '' && str[i] != null && str[i] != undefined) {
					//console.log("===>",str_start_date,str_end_date,str[i]);
					let str_info = str[i].split('tại');
					let address = str_info[1];
					let day_and_lesson = str_info[0].split('tiết');
					let lesson = day_and_lesson[1]
						.replace(' ', '')
						.replace(' ', '');
					let day = day_and_lesson[0]
						.replace(' ', '')
						.replace('Thứ', '');
					let lesson_array = lessonArray(lesson);
					for (let i = 0; i < lesson_array.length; i++) {
						//console.log(start_date, end_date, day, subject_name, address);
						let classes = findDatewithDay(
							start_date,
							end_date,
							day
						);

						classes.forEach((x) => {
							schedule.push({
								date: x,
								subjectName: subject_name,
								lesson: lesson,
								room: address,
							});
						});
					}
				}
			}
		};

		for (let i = 8; ; i++) {
			let row = jsonData[i];

			if (!row['__EMPTY']) {
				break;
			}

			let a = row['__EMPTY_6'].replace(' ', '').split('Từ');
			let subjecName = row['__EMPTY_2'];

			for (let i = 1; i < a.length; i++) {
				let str = a[i].replace('\n', '').split(':');

				let strDatetime = str[0].replace(' ', '').split('đến');

				let startDate = strDatetime[0];
				let endDate = strDatetime[1];

				handleClass(startDate, endDate, subjecName, str[1]);
			}
		}

		return schedule
	},
};