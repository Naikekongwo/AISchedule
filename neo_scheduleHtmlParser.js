// scheduleHtmlParser.js
// 负责处理从网页上抓取的课程数据


// 用于调试时输出数据
function DebugConsole(Text) {
    console.log(Text);
}

// ParseData 处理元数据
function ParseData(RawData) {
    
    /* 
    sectionTimes : 负责对应每一节课到对应时间点, 例如[{'section':1,'startTime':'8:00','endTime':'8:45'}]
    courseInfos : 内部储存course对象，格式如下 {name: '高级程序设计', teacher: '许国艳', weeks: Array(12), day: 2, sections: Array(2), …} }
    */
    let sectionTimes = [];
    let courseInfos = [];

    // 和Provider中的数据加密方式联动，这里分别是三者的分隔符（周/日/节）
    var WeekSplit = "WEK";
    var DaySplit = "DAY"
    var ClassSplit = "CLA"

    // 定义课堂间隔时间
    var ClassBreak = 5;

    // 以周为单位分割数据
    var RawDataSP = RawData.split(WeekSplit)

    // 按照每num个字符切割str字符串
    function lengthCutting(str, num) {
        let strArr = [];
        for (let i = 0; i < str.length; i += num) strArr.push(str.slice(i, i + num));
        return strArr;
    }

    // 处理sectionTime部分并储存至sectionTimes中
    function ParseTime(TIME) {

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

    ParseTime(RawDataSP[0]);

    /* 获取一门科目在周上的持续时间，例如7-9,11-13便会返回数组[7,8,9,11,12,13] */
    function GetWeeksDuration(StrTag) {
        if(StrTag!=undefined) {
            let weeks = [];
            //示例 '上课时间:第7-9,11-18周'
            // '第3,6周'
            var Temp = StrTag.split(":")[1];
            Temp = Temp.replace("第","");
            Temp = Temp.replace("周","");
            var TempNext = Temp.split(",");
            var TempNextNext = "";
            if(TempNext.length==1) {
                // 即该课程只有一个连续时间，没有跳周
                if(TempNext[0].split("-").length==1)
                {
                    weeks.push(parseInt(TempNext[0].split("-")[0]));
                } else {
                    TempNextNext = TempNext[0].split("-");
                    for(var i = parseInt(TempNextNext[0]);i<=parseInt(TempNextNext[1]);i++){
                        weeks.push(i);
                    }
                }
            } else {
                // 有多重时段
                for(var k = 0;k<TempNext.length;k++) {
                    if(TempNext[k].split("-").length==1)
                    {
                        //单周
                        weeks.push(parseInt(TempNext[k]));
                    } else {
                        TempNextNext = TempNext[k].split("-");
                        for(var i = parseInt(TempNextNext[0]);i<=parseInt(TempNextNext[1]);i++){
                            weeks.push(i);
                        }
                    }
                }
            }
            return weeks;
        }
    }

    /* 获取一门科目在一天内的持续时间，例如 2[08-09节]上课地点:致高楼B211 便会返回数组[8,9] */
    function GetSectionDuration(StrTag) {
        // 示例 2[08-09节]上课地点:致高楼B211
        if(StrTag!=undefined) {
            let Sections = [];
            var Temp = StrTag.split("上课地点")[0];
            // Temp此时为'2[08-09]节'
            Temp = Temp.split("[")[1].split("]")[0]
            // 此时为 08-09
            if(Temp.split("-").length==2){
                for(var i =parseInt( Temp.split('-')[0]);i<=parseInt( Temp.split('-')[1]);i++){
                    Sections.push(i);
                }
            } else if (Temp.split("-").length>2) {
                for(var i =parseInt( Temp.split('-')[0]);i<=parseInt( Temp.split('-')[Temp.split("-").length-1]);i++){
                    Sections.push(i);
                }
            }
            return Sections;
        }
    }
    DebugConsole(GetWeeksDuration("上课时间:第7,11周"))

    // 判断两节课有何相同又有何不同
    function CourseEuqal(Course1,Course2) {
        // DebugConsole(Course1.name+" "+Course2.name+"结果"+(Course1.name == Course2.name));
        if(Course1.name == Course2.name.substring(0,Course1.name.length)){
            // 这才考虑是否共存
            if(Course1.weeks.toString() == Course2.weeks.toString()){
                if(Course1.day == Course2.day) {
                    //周数相同，同天上课，完全相同
                    return 1; //不能共存
                } else {
                    return -1; //同周不同天，共存。
                }
            } else {
                //周数不同
                return -1;
            }
        } else {
            return 0; // 压根不是同一个科目
        }
    }

    for(var i = 1;i<=RawDataSP.length-1;i++)
        {
            let course = {};
            var CertainWeek = RawDataSP[i];
            // 指定周数据
            for(var j = 1;j<=7;j++)
            {
                // 具体到周几
                var CertainDay = CertainWeek.split(DaySplit);
                for(var k = 1;k<=7;k++){
                    if(CertainDay[k]!=undefined) {
                        CertainClass = CertainDay[k].split(ClassSplit);
                        for(var s = 0;s<=CertainClass.length;s++){
                            if(CertainClass[s]!=undefined) {
                                ClassInfo = CertainClass[s].split("x");
                                if(ClassInfo[0]!=''){
                                    course.name = ClassInfo[0];
                                    if(ClassInfo[5]!=undefined){
                                        course.teacher = ClassInfo[5].split("上课教师:")[1];
                                    }
                                    course.weeks = GetWeeksDuration(ClassInfo[3]);
                                    course.day = k;
                                    course.sections = GetSectionDuration(ClassInfo[4]);
                                    if(course.name!='' & course.weeks.length!=0) {
                                        course.position = ClassInfo[4].split("上课地点:")[1];
                                        if(course.position=="null"){
                                            course.position="未确定";
                                        }
                                        var Situation = 0;
                                        for(var w = 0;w<courseInfos.length;w++) {
                                            if(CourseEuqal(course,courseInfos[w])==0) {
                                                // 二者完全不相干
                                                continue;
                                            } else if(CourseEuqal(course,courseInfos[w])==-1) {
                                                // 二者可共存
                                                if(Situation==0)
                                                    Situation=1;
                                                continue;
                                            } else if(CourseEuqal(course,courseInfos[w])==1){
                                                // 二者不可共存
                                                Situation=-1;
                                                break;
                                            } else {
                                                continue;
                                            }
                                        }
                                        if(Situation==1){
                                            course.name = course.name + " ";
                                            courseInfos.push(course);
                                        } else if (Situation==0) {
                                            courseInfos.push(course);
                                        } else {
                                            DebugConsole("不可共存");
                                        }
                                    }
                                    course = {}
                                }
                            }
                        }
                    }
                }
            }
        }
        console.log(courseInfos.length);
        for(var i = 0;i<courseInfos.length;i++) {
            console.log(courseInfos[i]);
        }
        return {
            sectionTimes : sectionTimes,
            courseInfos : courseInfos
        }
}


// scheduleHtmlParser()
// 主入口函数
function scheduleHtmlParser(RawData) {
    let Cooked_Data = ParseData(RawData);
    return Cooked_Data;
}