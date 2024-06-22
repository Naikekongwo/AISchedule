// scheduleHtmlTimer.js
// 处理网页数据并捕获具体时间表


async function scheduleTimer({parserRes} = {}) {
    let sectionTimes = [];

    var Window = null;
    var Document = null;
    var WeekAmount = 0;
    var StartDate = null;
    var ClassBreak = 5;

    // 等待时间(每周课程表之间的间隔 单位:ms)
    var WaitTime = 500;

    // RefreshWindow 刷新页面并重新捕捉Window和Document句柄
    function RefreshWindow() {
        Window = window.top.document.getElementById("mainIframe").contentWindow;
        Document = Window.document;
    }

    // Init 初始化课程表并强行加载句柄
    async function Init() {
        await RefreshWindow();
        WeekAmount = Document.getElementById("xkzc").options.length; // 获取总周数
        await GotoPage(0);
        await GotoPage(0);
        StartDate = Document.getElementsByClassName("classTable-select")[0].innerText;
    }

    // wait函数，用于等待页面加载
    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // GotoPage 跳转至指定周
    async function GotoPage(Page) {
        let WeekSelect = Document.getElementById("xkzc");
        WeekSelect.selectedIndex = parseInt(Page);
        // FrameWindow.refKb("zc"); //旧方法，已经弃用
        WeekSelect.dispatchEvent(new Event('change'));
        RefreshWindow();
        // 刷新页面
        await wait(WaitTime);
    }

    // 注册网页,初始化
    await Init();

    var StartSemester = String((new Date(StartDate + " 00:00:00")).getTime());

    function lengthCutting(str, num) {
        let strArr = [];
        for (let i = 0; i < str.length; i += num) strArr.push(str.slice(i, i + num));
        return strArr;
    }

    function TimeAdd(Time,TimePlus) {
        var Dates = new Date("1970/1/18 "+String(Time)+":00");
        var AfterDate = new Date(Dates.getTime()+TimePlus*60000);
        var HourM = AfterDate.toLocaleString().split(" ")[1].split(":")
        return HourM[0] + ":"+ HourM[1];
        // 格式为 8:00
    }
    
    function PastTime(EndTime,StartTime) {
        var sTime = new Date("1970/1/18 "+StartTime+":00");
        var eTime = new Date("1970/1/18 "+EndTime+":00");
        var Past = eTime.getTime() - sTime.getTime();
        return Past/60000;
        // 单位为分钟
    }

    function ParseTime(TIME) {
        var ComponentClass = TIME.split("第");
        for(var i =1;i<ComponentClass.length;i++) {
            var Temp = ComponentClass[i].split("大节")[1].replace(new RegExp("（","gm"),"");
            Temp = Temp.replace(new RegExp("）","gm")," ");
            Temp = Temp.replace(new RegExp("小节","gm"),"");
            Temp = Temp.replace(new RegExp("～","gm")," ");
            var LCLASS_TEMP = Temp.split(" ");
            // LCLASS_TEMP 此时可能为 "0102" "08:00" "09:35"
            var ClassAmount = LCLASS_TEMP[0].length/2;
            var StartTime = LCLASS_TEMP[1];
            var EndTime = LCLASS_TEMP[2];
            var TimeLong = PastTime(EndTime,StartTime);
            var SingleClassDuration = (TimeLong - (ClassAmount-1)*ClassBreak)/(ClassAmount);
            for(var j = 0;j<ClassAmount;j++) {
                let SectionTime = {}
                SectionTime.section = parseInt(lengthCutting(LCLASS_TEMP[0],2)[j]);
                SectionTime.startTime = StartTime;
                SectionTime.endTime = TimeAdd(StartTime,SingleClassDuration);
                StartTime = TimeAdd(StartTime,SingleClassDuration+ClassBreak);
                sectionTimes.push(SectionTime);
            }
        }
    }

    var ScheduleLink;

    var RowCollection = Document.getElementsByClassName("row-one");
    for(var i = 0;i<RowCollection.length-1;i++) {
        ScheduleLink = ScheduleLink + RowCollection[i].innerText;
    }

    ScheduleLink = ScheduleLink.replace(new RegExp("\n","gm"),"");
    ScheduleLink = ScheduleLink.replace(new RegExp("\t","gm"),"");
    ScheduleLink = ScheduleLink.replace(new RegExp(" ","gm"),"x");
    ScheduleLink = ScheduleLink.replace(new RegExp("xx","gm"),"x");

    ParseTime(ScheduleLink);

    console.log(StartSemester)

    return {
        totalWeek: WeekAmount, // 总周数：[1, 30]之间的整数
        startSemester: String(StartSemester), // 开学时间：时间戳，13位长度字符串，推荐用代码生成
        startWithSunday: false, // 是否是周日为起始日，该选项为true时，会开启显示周末选项
        showWeekend: true, // 是否显示周末
        forenoon: 5, // 上午课程节数：[1, 10]之间的整数
        afternoon: 4, // 下午课程节数：[0, 10]之间的整数
        night: 3, // 晚间课程节数：[0, 10]之间的整数
        // sections: parserRes.sectionTimes,
        sections: sectionTimes,
    }
}