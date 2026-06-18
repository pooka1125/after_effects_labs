// Layer Position Offset - Manual Input Panel
// 선택한 레이어의 Position을 X/Y/Z 축에 대해
// "시작값" + "간격 * 인덱스" 방식으로 배치하는 패널

(function layerOffsetPanel(thisObj) {
    var scriptName = "Layer Position Offset - Manual Input";

    function buildUI(thisObj) {
        var pal = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", scriptName, undefined, { resizeable: true });

        if (pal !== null) {
            pal.orientation = "column";
            pal.alignChildren = ["fill", "top"];
            pal.margins = 10;

            // ===== X축 =====
            var xGroup = pal.add("panel", undefined, "X 축");
            xGroup.orientation = "column";
            xGroup.alignChildren = ["fill", "top"];
            xGroup.margins = 8;

            var xTop = xGroup.add("group");
            xTop.orientation = "row";
            var xUse = xTop.add("checkbox", undefined, "X 사용");
            xUse.value = true;

            var xStartGroup = xGroup.add("group");
            xStartGroup.orientation = "row";
            xStartGroup.add("statictext", undefined, "시작값:");
            var xStart = xStartGroup.add("edittext", undefined, "0");
            xStart.characters = 7;

            var xStepGroup = xGroup.add("group");
            xStepGroup.orientation = "row";
            xStepGroup.add("statictext", undefined, "간격:");
            var xStep = xStepGroup.add("edittext", undefined, "100");
            xStep.characters = 7;

            // ===== Y축 =====
            var yGroup = pal.add("panel", undefined, "Y 축");
            yGroup.orientation = "column";
            yGroup.alignChildren = ["fill", "top"];
            yGroup.margins = 8;

            var yTop = yGroup.add("group");
            yTop.orientation = "row";
            var yUse = yTop.add("checkbox", undefined, "Y 사용");
            yUse.value = false;

            var yStartGroup = yGroup.add("group");
            yStartGroup.orientation = "row";
            yStartGroup.add("statictext", undefined, "시작값:");
            var yStart = yStartGroup.add("edittext", undefined, "0");
            yStart.characters = 7;

            var yStepGroup = yGroup.add("group");
            yStepGroup.orientation = "row";
            yStepGroup.add("statictext", undefined, "간격:");
            var yStep = yStepGroup.add("edittext", undefined, "100");
            yStep.characters = 7;

            // ===== Z축 =====
            var zGroup = pal.add("panel", undefined, "Z 축");
            zGroup.orientation = "column";
            zGroup.alignChildren = ["fill", "top"];
            zGroup.margins = 8;

            var zTop = zGroup.add("group");
            zTop.orientation = "row";
            var zUse = zTop.add("checkbox", undefined, "Z 사용 (3D 레이어만)");
            zUse.value = false;

            var zStartGroup = zGroup.add("group");
            zStartGroup.orientation = "row";
            zStartGroup.add("statictext", undefined, "시작값:");
            var zStart = zStartGroup.add("edittext", undefined, "0");
            zStart.characters = 7;

            var zStepGroup = zGroup.add("group");
            zStepGroup.orientation = "row";
            zStepGroup.add("statictext", undefined, "간격:");
            var zStep = zStepGroup.add("edittext", undefined, "100");
            zStep.characters = 7;

            // 안내 텍스트
            var info = pal.add("statictext", undefined,
                "선택한 레이어들을 타임라인 순서(위→아래)로 정렬한 뒤,\n" +
                "각 축에 대해: 값 = 시작값 + (간격 × 인덱스) 로 배치합니다."
            );
            info.alignment = ["fill", "top"];

            // 버튼
            var btnGroup = pal.add("group");
            btnGroup.orientation = "row";
            btnGroup.alignment = ["fill", "bottom"];

            var applyBtn = btnGroup.add("button", undefined, "적용");
            var closeBtn = null;
            if (pal instanceof Window) {
                closeBtn = btnGroup.add("button", undefined, "닫기");
                closeBtn.onClick = function () {
                    pal.close();
                };
            }

            // ===== 적용 버튼 로직 =====
            applyBtn.onClick = function () {
                app.beginUndoGroup(scriptName);

                var comp = app.project.activeItem;
                if (!comp || !(comp instanceof CompItem)) {
                    alert("활성 컴포지션이 없습니다.");
                    app.endUndoGroup();
                    return;
                }

                var layers = comp.selectedLayers;
                if (!layers || layers.length === 0) {
                    alert("레이어를 하나 이상 선택하세요.");
                    app.endUndoGroup();
                    return;
                }

                // 최소 한 축 사용 여부 체크
                if (!xUse.value && !yUse.value && !zUse.value) {
                    alert("최소 한 개 이상의 축을 사용으로 체크하세요.");
                    app.endUndoGroup();
                    return;
                }

                // 숫자 파싱
                function parseOrZero(edit) {
                    var v = parseFloat(edit.text);
                    if (isNaN(v)) v = 0;
                    return v;
                }

                var sx = parseOrZero(xStart);
                var sy = parseOrZero(yStart);
                var sz = parseOrZero(zStart);

                var stepX = parseOrZero(xStep);
                var stepY = parseOrZero(yStep);
                var stepZ = parseOrZero(zStep);

                // 레이어들을 타임라인 인덱스 순으로 정렬
                layers.sort(function(a, b) {
                    return a.index - b.index;
                });

                // 첫 레이어의 차원(2D/3D) 기준
                var firstPos = layers[0].property("Position").value;
                var is3D = (firstPos.length === 3);

                // 각 레이어에 적용
                for (var i = 0; i < layers.length; i++) {
                    var layer = layers[i];
                    var posProp = layer.property("Position");
                    if (!posProp) continue;

                    var cur = posProp.value;
                    var x = cur[0];
                    var y = cur[1];
                    var z = is3D ? cur[2] : 0;

                    // 시작값 + 간격*인덱스
                    if (xUse.value) {
                        x = sx + stepX * i;
                    }
                    if (yUse.value) {
                        y = sy + stepY * i;
                    }
                    if (zUse.value && is3D) {
                        z = sz + stepZ * i;
                    }

                    if (is3D) {
                        posProp.setValue([x, y, z]);
                    } else {
                        posProp.setValue([x, y]);
                    }
                }

                app.endUndoGroup();
            };

            pal.layout.layout(true);
            pal.layout.resize();
            pal.onResizing = pal.onResize = function () { this.layout.resize(); };
        }

        return pal;
    }

    var myPal = buildUI(thisObj);
    if (myPal instanceof Window) {
        myPal.center();
        myPal.show();
    }

})(this);