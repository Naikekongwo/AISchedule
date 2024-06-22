// scheduleHtmlProvider.js
// 负责从网页上抓取课程数据并返回给scheduleHtmlParser


// 用于调试时输出数据
function DebugConsole(Text) {
    console.log(Text);
}

// scheduleHtmlProvider()
// 主入口函数
async function scheduleHtmlProvider() {

    Window = null;
    Document = null;
    WeekAmount = 0;
    StartDate = null;

    // 等待时间(每周课程表之间的间隔 单位:ms)
    WaitTime = 600;

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
        StartDate = Document.getElementsByClassName("classTable-select")[0].innerText;
    }

    // wait函数，用于等待页面加载
    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // GotoPage 跳转至指定周
    async function GotoPage(Page) {
        let WeekSelect = Document.getElementById("xkzc");
        DebugConsole(parseInt(Page));
        WeekSelect.selectedIndex = parseInt(Page);
        // FrameWindow.refKb("zc"); //旧方法，已经弃用
        WeekSelect.dispatchEvent(new Event('change'));
        RefreshWindow();
        // 刷新页面
        await wait(WaitTime);
    }

    // 加载小爱课程表
    await loadTool('AIScheduleTools');
    const { AIScheduleAlert } = AIScheduleTools();

    // 分隔符，用于分割元数据中的课程
    var WeekSplit = "WEK";
    var DaySplit = "DAY";
    var ClassSplit = "CLA";

    // 注册网页,初始化
    await Init();

    // 元数据，稍后返回
    var ClassTableRawData = "";

    var RowCollection = Document.getElementsByClassName("row-one");
    for(var i = 0;i<RowCollection.length-1;i++) {
        ClassTableRawData = ClassTableRawData + RowCollection[i].innerText;
    }

    // 遍历所有周的课程表
    for(let i = 0;i<WeekAmount;i++) {
        // 跳转至指定页
        let WeekSelect = Document.getElementById("xkzc");
        while(parseInt(WeekSelect.selectedIndex)!=i){
            DebugConsole(parseInt(WeekSelect.selectedIndex)!=i);
            await GotoPage(i);
            await GotoPage(i);
        }

        ClassTableRawData = ClassTableRawData + WeekSplit;
        // 遍历所有天的课程表
        for(let i2 = 0;i2<7;i2++) {
            ClassTableRawData = ClassTableRawData + DaySplit;
            // 获取所有课程的信息
            let ClassCollection = Document.getElementsByClassName("table-class div-context day"+i2);
            let ClassAmount = ClassCollection.length;
            // 遍历一天中所有的课程
            for(let i3 = 0;i3<ClassAmount;i3++) {
                ClassTableRawData = ClassTableRawData + ClassSplit + ClassCollection[i3].getElementsByClassName("suspension-table-class")[0].innerText;
            }
        }
    }

    // 去除所有换行符和空格，减小数据体积
    ClassTableRawData = ClassTableRawData.replace(new RegExp("\n","gm"),"");
    ClassTableRawData = ClassTableRawData.replace(new RegExp("\t","gm"),"");
    ClassTableRawData = ClassTableRawData.replace(new RegExp(" ","gm"),"x");
    ClassTableRawData = ClassTableRawData.replace(new RegExp("xx","gm"),"x");
    console.log(ClassTableRawData);
    return ClassTableRawData;
}

