"ui";

var DEFAULT_MESSAGES = [
    "你好-告诉我你-在干嘛呢?",
    "哈喽-认识一下-不为别的-来到这里都是缘分-你说呢?",
    "嘿嘿!-刚刚我说你会理我-别人不信-和我倔呢",
    "莫西莫西-你是花姑娘吗?-你不是的话那我是-认识下",
    "出来聊天",
    "是一个人吗",
    "你有没有人陪?",
    "今天有一点点不开心-你开心不?-你不开心我说出来让你开心开心?",
    "正在通话中-正在通话中-正在通话中-你在干啥?和谁打电话?快理我",
    "单身久了-你看看我是否符合你的胃口-饿不饿?"
];

var myAPP = {
    version: "V0.2.0-daily-sync",
    title: "Tangerine V0.2.0",
    characteristic: "Tangerine童话",
    dailyQueuePath: "/sdcard/Tangerine每日老板.txt",
    writtenPath: "/sdcard/Storewrittenpath.txt",
    targetPackage: "com.xinhe.tataxingqiu",
    targetActivity: "com.xhtq.app.main.ui.MainSearchActivity",
    deviceOptions: ["雷电模拟器9", "雷电模拟器5", "MuMu模拟器", "手机"]
};

var store = storages.create(myAPP.characteristic);
var logs = [];
var messageInputs = [];
var messageChecks = [];
var imageChecks = [];

ui.statusBarColor("#EF8F84");
ui.layout(
    <drawer id="drawer">
        <vertical>
            <appbar>
                <toolbar id="toolbar" title="{{myAPP.title}}" />
                <tabs id="tabs" />
            </appbar>

            <card w="*" margin="10 8" cardCornerRadius="6dp" cardElevation="1dp">
                <horizontal padding="8">
                    <button id="saveButton" layout_weight="1" text="保存配置" />
                    <button id="syncButton" layout_weight="1" text="同步今日数据" margin="8 0 0 0" />
                    <button id="startButton" layout_weight="1" text="启动和保存文件点这" margin="8 0 0 0" />
                </horizontal>
            </card>

            <viewpager id="pager">
                <ScrollView>
                    <vertical padding="10">
                        <card w="*" h="auto" margin="0 0 0 8" cardCornerRadius="4dp" cardElevation="1dp">
                            <vertical padding="16 12">
                                <horizontal gravity="center_vertical">
                                    <Switch id="autoService" text="无障碍服务:" checked="{{auto.service != null}}" />
                                    <text text="后期接自动点击时再开" textColor="#555555" margin="8 0 0 0" />
                                </horizontal>
                            </vertical>
                        </card>

                        <card w="*" h="auto" margin="0 0 0 8" cardCornerRadius="4dp" cardElevation="1dp">
                            <vertical padding="16 12">
                                <text text="本地测试设置" textStyle="bold" textSize="16sp" />
                                <spinner id="设备" entries="{{myAPP.deviceOptions}}" margin="0 8 0 0" />
                                <horizontal>
                                    <checkbox id="每日老板" text="每日老板" />
                                    <checkbox id="自加老板" text="自加老板" checked="true" margin="12 0 0 0" />
                                </horizontal>
                                <checkbox id="筛自加id" text="自加id不重复写" checked="true" margin="0 4 0 0" />
                                <text text="速度调节(建议10000):" margin="0 8 0 0" />
                                <input id="速度调节" inputType="number" text="10000" />
                                <text text="随机范围(建议5000):" margin="0 8 0 0" />
                                <input id="随机范围" inputType="number" text="5000" />
                            </vertical>
                        </card>

                        <card w="*" h="auto" margin="0 0 0 8" cardCornerRadius="4dp" cardElevation="1dp">
                            <vertical padding="16 12">
                                <text text="云端同步设置" textStyle="bold" textSize="16sp" />
                                <text text="先不填也可以，当前主要用于本地自加id测试，留空时不会请求云端。" textColor="#555555" margin="0 6 0 0" />
                                <text text="数据源地址" />
                                <input id="数据源地址" hint="支持纯文本或 JSON 地址" />
                                <text id="同步状态" text="今日同步状态：未同步" textColor="#666666" margin="0 8 0 0" />
                                <text id="同步说明" text="纯文本格式：一行一个 id；JSON 格式：支持 ids/items/data/list 数组。" textColor="#777777" margin="0 6 0 0" />
                            </vertical>
                        </card>

                        <card w="*" h="auto" margin="0 0 0 8" cardCornerRadius="4dp" cardElevation="1dp">
                            <vertical padding="16 12">
                                <text text="复制的id" textStyle="bold" textSize="16sp" />
                                <text text="如果是群里复制的原始文本，可以先粘到这里。关键词为空时会直接抓里面的数字 id。" textColor="#555555" margin="0 6 0 0" />
                                <text text="筛选关键词" />
                                <input id="关键词" hint="例如 id:" />
                                <text text="群里添加id" margin="0 8 0 0" />
                                <input id="群里添加id" gravity="top" minLines="5" hint="把原始文本粘到这里" />
                                <button id="提取按钮" text="筛选添加的id到待写的id里" margin="0 8 0 0" />
                            </vertical>
                        </card>

                        <card w="*" h="auto" cardCornerRadius="4dp" cardElevation="1dp">
                            <vertical padding="16 12">
                                <text text="本地id管理" textStyle="bold" textSize="16sp" />
                                <text text="自己添加id" />
                                <input id="自己添加id" gravity="top" minLines="7" hint="一行一个 id" />
                                <text text="不写的id" margin="0 8 0 0" />
                                <input id="不写的id" gravity="top" minLines="5" hint="一行一个 id" />
                                <button id="清理按钮" text="清理已写id库" margin="0 8 0 0" />
                            </vertical>
                        </card>
                    </vertical>
                </ScrollView>

                <ScrollView>
                    <vertical padding="10">
                        <card w="*" h="auto" margin="0 0 0 8" cardCornerRadius="4dp" cardElevation="1dp">
                            <vertical padding="16 12">
                                <text text="文案设置" textStyle="bold" textSize="16sp" />
                                <text text="- 是分隔符。勾选后会随机取一条文案，日志里会按分段显示。" textColor="#555555" margin="0 6 0 0" />
                            </vertical>
                        </card>

                        <card w="*" h="auto" margin="0 0 0 8" cardCornerRadius="4dp" cardElevation="1dp"><vertical padding="12 10"><checkbox id="文案一勾选" text="文案一：" checked="true" /><input id="文案一" /></vertical></card>
                        <card w="*" h="auto" margin="0 0 0 8" cardCornerRadius="4dp" cardElevation="1dp"><vertical padding="12 10"><checkbox id="文案二勾选" text="文案二：" checked="true" /><input id="文案二" /></vertical></card>
                        <card w="*" h="auto" margin="0 0 0 8" cardCornerRadius="4dp" cardElevation="1dp"><vertical padding="12 10"><checkbox id="文案三勾选" text="文案三：" checked="true" /><input id="文案三" /></vertical></card>
                        <card w="*" h="auto" margin="0 0 0 8" cardCornerRadius="4dp" cardElevation="1dp"><vertical padding="12 10"><checkbox id="文案四勾选" text="文案四：" checked="true" /><input id="文案四" /></vertical></card>
                        <card w="*" h="auto" margin="0 0 0 8" cardCornerRadius="4dp" cardElevation="1dp"><vertical padding="12 10"><checkbox id="文案五勾选" text="文案五：" checked="true" /><input id="文案五" /></vertical></card>
                        <card w="*" h="auto" margin="0 0 0 8" cardCornerRadius="4dp" cardElevation="1dp"><vertical padding="12 10"><checkbox id="文案六勾选" text="文案六：" checked="true" /><input id="文案六" /></vertical></card>
                        <card w="*" h="auto" margin="0 0 0 8" cardCornerRadius="4dp" cardElevation="1dp"><vertical padding="12 10"><checkbox id="文案七勾选" text="文案七：" checked="true" /><input id="文案七" /></vertical></card>
                        <card w="*" h="auto" margin="0 0 0 8" cardCornerRadius="4dp" cardElevation="1dp"><vertical padding="12 10"><checkbox id="文案八勾选" text="文案八：" checked="true" /><input id="文案八" /></vertical></card>
                        <card w="*" h="auto" margin="0 0 0 8" cardCornerRadius="4dp" cardElevation="1dp"><vertical padding="12 10"><checkbox id="文案九勾选" text="文案九：" checked="true" /><input id="文案九" /></vertical></card>
                        <card w="*" h="auto" cardCornerRadius="4dp" cardElevation="1dp"><vertical padding="12 10"><checkbox id="文案十勾选" text="文案十：" checked="true" /><input id="文案十" /></vertical></card>
                    </vertical>
                </ScrollView>

                <ScrollView>
                    <vertical padding="10">
                        <card w="*" h="auto" margin="0 0 0 8" cardCornerRadius="4dp" cardElevation="1dp">
                            <vertical padding="16 12">
                                <text text="图片与日志" textStyle="bold" textSize="16sp" />
                                <horizontal margin="0 8 0 0">
                                    <checkbox id="图1" text="图1" />
                                    <checkbox id="图2" text="图2" margin="16 0 0 0" />
                                    <checkbox id="图3" text="图3" margin="16 0 0 0" />
                                    <checkbox id="图4" text="图4" margin="16 0 0 0" />
                                </horizontal>
                                <text text="目标应用包名：" margin="0 8 0 0" />
                                <text text="{{myAPP.targetPackage}}" textColor="#666666" />
                                <text text="入口组件：" margin="0 8 0 0" />
                                <text text="{{myAPP.targetActivity}}" textColor="#666666" />
                            </vertical>
                        </card>

                        <card w="*" h="auto" cardCornerRadius="4dp" cardElevation="1dp">
                            <vertical padding="16 12">
                                <text text="日志" textStyle="bold" textSize="16sp" />
                                <input id="日志" gravity="top" minLines="14" enabled="false" />
                            </vertical>
                        </card>
                    </vertical>
                </ScrollView>
            </viewpager>
        </vertical>

        <ScrollView layout_gravity="left" bg="#F0F8FF" w="300">
            <vertical padding="10">
                <card w="*" h="auto" margin="0 0 0 8" cardCornerRadius="4dp" cardElevation="1dp">
                    <vertical padding="16 10">
                        <text text="免责声明" gravity="center_horizontal" textStyle="bold" textSize="26sp" textColor="#D32F2F" />
                    </vertical>
                </card>
                <card w="*" h="auto" margin="0 0 0 8" cardCornerRadius="4dp" cardElevation="1dp"><vertical padding="14 10"><text text="1. 当前版本是独立实现，不包含老师原版的卡密逻辑。" /></vertical></card>
                <card w="*" h="auto" margin="0 0 0 8" cardCornerRadius="4dp" cardElevation="1dp"><vertical padding="14 10"><text text="2. 每日老板数据支持远程同步，但脚本会把请求限制为每天最多一次。" /></vertical></card>
                <card w="*" h="auto" margin="0 0 0 8" cardCornerRadius="4dp" cardElevation="1dp"><vertical padding="14 10"><text text="3. 不填数据源地址时，仍然可以继续用本地手动队列。" /></vertical></card>
                <card w="*" h="auto" cardCornerRadius="4dp" cardElevation="1dp"><vertical padding="14 10"><text text="版本：{{myAPP.version}}" /><text text="请认真仔细阅读左上角三横里的内容" margin="0 6 0 0" /></vertical></card>
            </vertical>
        </ScrollView>
    </drawer>
);

ui.pager.setTitles(["基础设置", "文案设置", "图片与日志"]);
ui.tabs.setupWithViewPager(ui.pager);

messageInputs = [ui.文案一, ui.文案二, ui.文案三, ui.文案四, ui.文案五, ui.文案六, ui.文案七, ui.文案八, ui.文案九, ui.文案十];
messageChecks = [ui.文案一勾选, ui.文案二勾选, ui.文案三勾选, ui.文案四勾选, ui.文案五勾选, ui.文案六勾选, ui.文案七勾选, ui.文案八勾选, ui.文案九勾选, ui.文案十勾选];
imageChecks = [ui.图1, ui.图2, ui.图3, ui.图4];

ensureLocalFiles();
loadConfig();
refreshSyncStatus();
appendLog("已载入本地版工程。");

ui.autoService.on("check", function(checked) {
    if (checked && auto.service == null) {
        app.startActivity({
            action: "android.settings.ACCESSIBILITY_SETTINGS"
        });
        return;
    }
    if (!checked && auto.service != null) {
        auto.service.disableSelf();
    }
});

ui.emitter.on("resume", function() {
    ui.run(function() {
        ui.autoService.setChecked(auto.service != null);
    });
});

ui.saveButton.on("click", function() {
    saveConfig();
});

ui.syncButton.on("click", function() {
    saveConfig();
    syncToday(true);
});

ui.startButton.on("click", function() {
    saveConfig();
    startLocalPreview();
});

ui.提取按钮.on("click", function() {
    var ids = extractIds(String(ui.群里添加id.text() || ""), String(ui.关键词.text() || ""));
    if (!ids.length) {
        toastLog("没有提取到 id");
        appendLog("提取失败：没有识别到可用 id。");
        return;
    }
    var current = linesToArray(String(ui.自己添加id.text() || ""));
    var merged = uniqueList(current.concat(ids));
    ui.自己添加id.setText(merged.join("\n"));
    if (ui.筛自加id.isChecked()) {
        filterSelfAddedIds();
    }
    saveConfig();
    appendLog("群文本提取完成，导入数量：" + ids.length);
    toastLog("已导入 " + ids.length + " 个 id");
});

ui.清理按钮.on("click", function() {
    files.write(myAPP.writtenPath, "");
    appendLog("已清空已写 id 库：" + myAPP.writtenPath);
    refreshSyncStatus();
    toastLog("已清空已写 id 库");
});

threads.start(function() {
    if (String(store.get("数据源地址") || "").trim()) {
        syncToday(false);
    } else {
        appendLog("未设置数据源地址，当前使用本地模式。");
    }
});

function ensureLocalFiles() {
    ensureFile(myAPP.dailyQueuePath);
    ensureFile(myAPP.writtenPath);
}

function ensureFile(path) {
    if (!files.exists(path)) {
        files.createWithDirs(path);
        files.write(path, "");
    }
}

function appendLog(message) {
    var line = "[" + nowTime() + "] " + message;
    logs.push(line);
    if (logs.length > 120) {
        logs.shift();
    }
    console.log(line);
    ui.run(function() {
        ui.日志.setText(logs.join("\n"));
    });
}

function nowTime() {
    var now = new Date();
    return pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
}

function todayKey() {
    var now = new Date();
    return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
}

function pad(value) {
    return value < 10 ? "0" + value : String(value);
}

function saveConfig() {
    normalizeMode();
    store.put("设备", ui.设备.getSelectedItemPosition());
    store.put("每日老板", ui.每日老板.isChecked());
    store.put("自加老板", ui.自加老板.isChecked());
    store.put("筛自加id", ui.筛自加id.isChecked());
    store.put("速度调节", String(ui.速度调节.text() || ""));
    store.put("随机范围", String(ui.随机范围.text() || ""));
    store.put("关键词", String(ui.关键词.text() || ""));
    store.put("群里添加id", String(ui.群里添加id.text() || ""));
    store.put("自己添加id", String(ui.自己添加id.text() || ""));
    store.put("不写的id", String(ui.不写的id.text() || ""));
    store.put("数据源地址", String(ui.数据源地址.text() || "").trim());
    for (var i = 0; i < messageInputs.length; i++) {
        store.put("文案" + (i + 1), String(messageInputs[i].text() || ""));
        store.put("文案" + (i + 1) + "勾选", messageChecks[i].isChecked());
    }
    for (var j = 0; j < imageChecks.length; j++) {
        store.put("图" + (j + 1), imageChecks[j].isChecked());
    }
    appendLog("配置已保存。");
}

function loadConfig() {
    var value = store.get("设备");
    if (value !== null && value !== undefined) {
        ui.设备.setSelection(value);
    }
    ui.每日老板.setChecked(store.get("每日老板", false));
    ui.自加老板.setChecked(store.get("自加老板", true));
    ui.筛自加id.setChecked(store.get("筛自加id", true));
    setTextIfStored(ui.速度调节, store.get("速度调节", "10000"));
    setTextIfStored(ui.随机范围, store.get("随机范围", "5000"));
    setTextIfStored(ui.关键词, store.get("关键词", ""));
    setTextIfStored(ui.群里添加id, store.get("群里添加id", ""));
    setTextIfStored(ui.自己添加id, store.get("自己添加id", ""));
    setTextIfStored(ui.不写的id, store.get("不写的id", ""));
    setTextIfStored(ui.数据源地址, store.get("数据源地址", ""));

    for (var i = 0; i < messageInputs.length; i++) {
        setTextIfStored(messageInputs[i], store.get("文案" + (i + 1), DEFAULT_MESSAGES[i]));
        messageChecks[i].setChecked(store.get("文案" + (i + 1) + "勾选", true));
    }
    for (var j = 0; j < imageChecks.length; j++) {
        imageChecks[j].setChecked(store.get("图" + (j + 1), false));
    }
}

function setTextIfStored(view, value) {
    view.setText(String(value == null ? "" : value));
}

function refreshSyncStatus() {
    var date = String(store.get("lastSyncDate") || "");
    var count = String(store.get("lastSyncCount") || "0");
    var lastMessage = String(store.get("lastSyncMessage") || "未同步");
    ui.run(function() {
        ui.同步状态.setText("今日同步状态：" + lastMessage + (date ? " | 日期：" + date + " | 数量：" + count : ""));
    });
}

function syncToday(force) {
    try {
        var sourceUrl = String(ui.数据源地址.text() || "").trim();
        var today = todayKey();
        if (!sourceUrl) {
            appendLog("未填写数据源地址，当前是本地自加id测试模式。");
            store.put("lastSyncMessage", "未配置数据源");
            refreshSyncStatus();
            return false;
        }
        if (!force && store.get("lastSyncDate", "") === today) {
            appendLog("今天已经同步过，跳过重复请求。");
            store.put("lastSyncMessage", "今日已同步");
            refreshSyncStatus();
            return true;
        }

        appendLog("开始拉取今日数据：" + sourceUrl);
        var response = http.get(sourceUrl);
        if (!response) {
            appendLog("同步失败：没有收到响应。");
            store.put("lastSyncMessage", "同步失败");
            refreshSyncStatus();
            return false;
        }
        if (response.statusCode < 200 || response.statusCode >= 300) {
            appendLog("同步失败：HTTP " + response.statusCode);
            store.put("lastSyncMessage", "同步失败");
            refreshSyncStatus();
            return false;
        }

        var body = String(response.body.string() || "");
        var ids = parseRemotePayload(body);
        ids = filterAgainstExcluded(ids);
        if (!ids.length) {
            appendLog("同步完成，但没有拿到可用 id。");
            store.put("lastSyncMessage", "同步为空");
            refreshSyncStatus();
            return false;
        }

        files.write(myAPP.dailyQueuePath, ids.join("\n"));
        store.put("lastSyncDate", today);
        store.put("lastSyncCount", ids.length);
        store.put("lastSyncMessage", "同步成功");
        store.put("lastSyncSource", sourceUrl);
        appendLog("今日数据同步成功，共 " + ids.length + " 条，已写入：" + myAPP.dailyQueuePath);
        refreshSyncStatus();
        return true;
    } catch (error) {
        appendLog("同步异常：" + error);
        store.put("lastSyncMessage", "同步异常");
        refreshSyncStatus();
        return false;
    }
}

function parseRemotePayload(raw) {
    var text = String(raw || "").replace(/^\uFEFF/, "").trim();
    if (!text) {
        return [];
    }

    var ids = [];
    try {
        var parsed = JSON.parse(text);
        ids = parseJsonIds(parsed);
    } catch (error) {
        ids = [];
    }

    if (!ids.length) {
        ids = extractIds(text, "");
    }
    return uniqueList(ids);
}

function parseJsonIds(value) {
    var result = [];
    if (value === null || value === undefined) {
        return result;
    }
    if (Array.isArray(value)) {
        for (var i = 0; i < value.length; i++) {
            result = result.concat(parseJsonIds(value[i]));
        }
        return result;
    }
    if (typeof value === "string" || typeof value === "number") {
        var id = normalizeId(String(value));
        return id ? [id] : [];
    }
    if (typeof value === "object") {
        var priorityKeys = ["ids", "items", "data", "list", "records", "rows", "values"];
        for (var j = 0; j < priorityKeys.length; j++) {
            if (value.hasOwnProperty(priorityKeys[j])) {
                result = result.concat(parseJsonIds(value[priorityKeys[j]]));
            }
        }
        if (result.length) {
            return result;
        }
        for (var key in value) {
            if (value.hasOwnProperty(key)) {
                result = result.concat(parseJsonIds(value[key]));
            }
        }
    }
    return result;
}

function filterAgainstExcluded(ids) {
    var excluded = buildExcludedMap();
    var result = [];
    for (var i = 0; i < ids.length; i++) {
        var id = normalizeId(ids[i]);
        if (!id) {
            continue;
        }
        if (!excluded[id]) {
            result.push(id);
        }
    }
    return uniqueList(result);
}

function buildExcludedMap() {
    var map = {};
    var manual = linesToArray(String(ui.不写的id.text() || ""));
    var written = readLines(myAPP.writtenPath);
    var merged = manual.concat(written);
    for (var i = 0; i < merged.length; i++) {
        var id = normalizeId(merged[i]);
        if (id) {
            map[id] = true;
        }
    }
    return map;
}

function startLocalPreview() {
    if (ui.每日老板.isChecked()) {
        syncToday(false);
    }
    var nextId = pickNextId();
    if (!nextId) {
        appendLog("启动失败：当前没有可处理的 id。");
        toastLog("没有可处理的 id");
        return;
    }
    appendLine(myAPP.writtenPath, nextId);
    var message = pickRandomMessage();
    var parts = splitMessage(message);
    var images = selectedImages();

    appendLog("已取出一个老板 id：" + nextId);
    appendLog("当前设备：" + myAPP.deviceOptions[ui.设备.getSelectedItemPosition()]);
    appendLog("目标应用包名：" + myAPP.targetPackage);
    appendLog("入口组件：" + myAPP.targetActivity);
    if (parts.length) {
        appendLog("随机文案共 " + parts.length + " 段：" + parts.join(" / "));
    } else {
        appendLog("当前没有勾选任何有效文案。");
    }
    appendLog(images.length ? "当前已勾选图片：" + images.join(", ") : "当前没有勾选图片。");
    appendLog("本次仍然只是本地预演，尚未接入真正的自动点击与发图逻辑。");
    refreshSyncStatus();
}

function pickNextId() {
    normalizeMode();
    if (ui.每日老板.isChecked()) {
        var queue = filterDailyQueue();
        var chosen = takeRandom(queue);
        files.write(myAPP.dailyQueuePath, queue.join("\n"));
        return chosen || "";
    }
    var list = linesToArray(String(ui.自己添加id.text() || ""));
    if (ui.筛自加id.isChecked()) {
        list = filterSelfAddedIds();
    }
    var id = takeRandom(list);
    ui.自己添加id.setText(list.join("\n"));
    store.put("自己添加id", list.join("\n"));
    return id || "";
}

function filterDailyQueue() {
    var excluded = buildExcludedMap();
    var queue = readLines(myAPP.dailyQueuePath);
    var result = [];
    for (var i = 0; i < queue.length; i++) {
        var id = normalizeId(queue[i]);
        if (!id) {
            continue;
        }
        if (!excluded[id]) {
            result.push(id);
        }
    }
    result = uniqueList(result);
    files.write(myAPP.dailyQueuePath, result.join("\n"));
    return result;
}

function filterSelfAddedIds() {
    var excluded = buildExcludedMap();
    var source = linesToArray(String(ui.自己添加id.text() || ""));
    var result = [];
    var seen = {};
    for (var i = 0; i < source.length; i++) {
        var id = normalizeId(source[i]);
        if (!id) {
            continue;
        }
        if (excluded[id] || seen[id]) {
            continue;
        }
        seen[id] = true;
        result.push(id);
    }
    ui.自己添加id.setText(result.join("\n"));
    store.put("自己添加id", result.join("\n"));
    appendLog("自加 id 筛重完成，剩余数量：" + result.length);
    return result;
}

function pickRandomMessage() {
    var list = [];
    for (var i = 0; i < messageInputs.length; i++) {
        if (!messageChecks[i].isChecked()) {
            continue;
        }
        var text = String(messageInputs[i].text() || "").trim();
        if (text) {
            list.push(text);
        }
    }
    return list.length ? list[Math.floor(Math.random() * list.length)] : "";
}

function splitMessage(text) {
    var parts = String(text || "").split("-");
    var result = [];
    for (var i = 0; i < parts.length; i++) {
        var item = parts[i].trim();
        if (item) {
            result.push(item);
        }
    }
    return result;
}

function selectedImages() {
    var result = [];
    for (var i = 0; i < imageChecks.length; i++) {
        if (imageChecks[i].isChecked()) {
            result.push("图" + (i + 1));
        }
    }
    return result;
}

function normalizeMode() {
    if (ui.每日老板.isChecked() && ui.自加老板.isChecked()) {
        ui.自加老板.setChecked(false);
    }
    if (!ui.每日老板.isChecked() && !ui.自加老板.isChecked()) {
        ui.每日老板.setChecked(true);
    }
}

function extractIds(text, keyword) {
    var lines = String(text || "").split(/\r\n|\r|\n/);
    var keywordText = String(keyword || "").trim().toLowerCase();
    var result = [];
    for (var i = 0; i < lines.length; i++) {
        var line = String(lines[i] || "").trim();
        if (!line) {
            continue;
        }
        if (keywordText && line.toLowerCase().indexOf(keywordText) === -1) {
            continue;
        }
        var id = normalizeId(line);
        if (id) {
            result.push(id);
        }
    }
    return uniqueList(result);
}

function normalizeId(value) {
    var text = String(value || "").trim();
    if (!text) {
        return "";
    }
    var match = text.match(/\d+/);
    return match ? match[0] : "";
}

function linesToArray(text) {
    var lines = String(text || "").split(/\r\n|\r|\n/);
    var result = [];
    for (var i = 0; i < lines.length; i++) {
        var item = normalizeId(lines[i]);
        if (item) {
            result.push(item);
        }
    }
    return uniqueList(result);
}

function uniqueList(list) {
    var seen = {};
    var result = [];
    for (var i = 0; i < list.length; i++) {
        var item = String(list[i] || "").trim();
        if (!item) {
            continue;
        }
        if (!seen[item]) {
            seen[item] = true;
            result.push(item);
        }
    }
    return result;
}

function takeRandom(list) {
    if (!list.length) {
        return "";
    }
    var index = Math.floor(Math.random() * list.length);
    return list.splice(index, 1)[0];
}

function readLines(path) {
    ensureFile(path);
    return linesToArray(files.read(path));
}

function appendLine(path, line) {
    if (!line) {
        return;
    }
    var current = readLines(path);
    current.push(line);
    files.write(path, uniqueList(current).join("\n"));
}
