(function(thisObj) {
    function buildUI(thisObj) {
        var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Marker_Time", undefined, {resizeable: true});
        panel.minimumSize = [30, 30];

        var mainGroup = panel.add("group");
        mainGroup.orientation = "column";
        mainGroup.alignChildren = ["fill", "top"];
        mainGroup.margins = [2, 2, 2, 2];

        // 생성 버튼
        var createBtn = mainGroup.add("button", undefined, "생성");
        createBtn.alignment = ["fill", "top"];
        createBtn.minimumSize = [10, 18];

        // 정렬 버튼
        var sortBtn = mainGroup.add("button", undefined, "정렬");
        sortBtn.alignment = ["fill", "top"];
        sortBtn.minimumSize = [10, 18];

        // 생성 버튼 기능
        createBtn.onClick = function() {
            app.beginUndoGroup("마커 기반 텍스트 레이어 길이 및 앵커포인트 조정");

            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) {
                alert("컴포지션을 선택해주세요.");
                app.endUndoGroup();
                return;
            }

            // 마커 레이어 찾기
            var markerLayer = null;
            if (comp.selectedLayers.length > 0) {
                for (var i = 0; i < comp.selectedLayers.length; i++) {
                    var layer = comp.selectedLayers[i];
                    if (layer.property("Marker") && layer.property("Marker").numKeys > 0) {
                        markerLayer = layer;
                        break;
                    }
                }
            }
            if (!markerLayer) {
                for (var i = 1; i <= comp.numLayers; i++) {
                    var layer = comp.layer(i);
                    if (layer.property("Marker") && layer.property("Marker").numKeys > 0) {
                        markerLayer = layer;
                        break;
                    }
                }
            }

            if (!markerLayer) {
                alert("마커가 있는 레이어를 찾을 수 없습니다.");
                app.endUndoGroup();
                return;
            }

            // 마커 시간 추출
            var markers = [];
            var markerProp = markerLayer.property("Marker");
            for (var i = 1; i <= markerProp.numKeys; i++) {
                markers.push(markerProp.keyTime(i));
            }

            if (markers.length === 0) {
                alert("마커가 발견되지 않았습니다.");
                app.endUndoGroup();
                return;
            }

            // 조정할 텍스트 레이어 선택
            var layersToAdjust = [];
            if (comp.selectedLayers.length > 0) {
                for (var i = 0; i < comp.selectedLayers.length; i++) {
                    var sel = comp.selectedLayers[i];
                    if (sel instanceof TextLayer && sel != markerLayer) {
                        layersToAdjust.push(sel);
                    }
                }
            }
            if (layersToAdjust.length === 0) {
                for (var i = 1; i <= comp.numLayers; i++) {
                    var layer = comp.layer(i);
                    if (layer instanceof TextLayer && layer != markerLayer) {
                        layersToAdjust.push(layer);
                    }
                }
            }

            if (layersToAdjust.length === 0) {
                alert("조정할 텍스트 레이어가 없습니다.");
                app.endUndoGroup();
                return;
            }

            // 레이어 길이 및 앵커포인트 조정
            for (var i = 0; i < layersToAdjust.length; i++) {
                var currentLayer = layersToAdjust[i];
                if (markers.length > 1) {
                    var markerIndex = i % (markers.length - 1);
                    
                    currentLayer.inPoint = markers[markerIndex];
                    currentLayer.outPoint = markers[markerIndex + 1];
                    
                    try {
                        var sourceRect = currentLayer.sourceRectAtTime(currentLayer.inPoint, false);
                        var anchorX = sourceRect.left + (sourceRect.width / 2);
                        var anchorY = sourceRect.top + (sourceRect.height / 2);
                        currentLayer.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([anchorX, anchorY]);
                        
                        currentLayer.property("ADBE Transform Group").property("ADBE Position").setValue([
                            comp.width / 2,
                            comp.height / 2
                        ]);
                    } catch(e) {
                        alert("레이어 " + currentLayer.name + "에서 오류 발생: " + e.toString());
                    }
                }
            }

            // Null 레이어 자동 삭제 (시간 기준점으로 사용된 경우, 확실하게)
            if (
                markerLayer &&
                ((markerLayer.nullLayer === true) || // AVLayer의 nullLayer 속성
                 (markerLayer.source && markerLayer.source.isNullObject)) // AVItem의 isNullObject
            ) {
                markerLayer.remove();
            }

            app.endUndoGroup();
        };

        // 정렬 버튼 기능
        sortBtn.onClick = function() {
            app.beginUndoGroup("레이어 시간 순서로 정렬");
            
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) {
                alert("컴포지션을 선택해주세요.");
                app.endUndoGroup();
                return;
            }
            
            var layersToSort = [];
            if (comp.selectedLayers.length > 0) {
                layersToSort = comp.selectedLayers;
            } else {
                for (var i = 1; i <= comp.numLayers; i++) {
                    layersToSort.push(comp.layer(i));
                }
            }
            
            if (layersToSort.length <= 1) {
                alert("정렬할 레이어가 충분하지 않습니다.");
                app.endUndoGroup();
                return;
            }
            
            var layerData = [];
            for (var i = 0; i < layersToSort.length; i++) {
                layerData.push({
                    layer: layersToSort[i],
                    inPoint: layersToSort[i].inPoint
                });
            }
            
            layerData.sort(function(a, b) {
                return a.inPoint - b.inPoint;
            });
            
            for (var i = 0; i < layerData.length; i++) {
                layerData[i].layer.moveToBeginning();
            }
            
            app.endUndoGroup();
        };

        panel.onResizing = panel.onResize = function () {
            var w = panel.size[0] - 4;
            if (w < 10) w = 10;
            createBtn.size.width = w;
            sortBtn.size.width = w;
            panel.layout.resize();
        };

        return panel;
    }

    var myPanel = buildUI(thisObj);
    if (myPanel instanceof Window) {
        myPanel.center();
        myPanel.show();
    } else {
        myPanel.layout.layout(true);
    }
})(this);

