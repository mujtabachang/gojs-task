var myDiagram;                                                                                  // mujtabachang: Made this into a global variable so that the timer.js can access it

function init() {
    var $ = go.GraphObject.make;
    myDiagram = $(go.Diagram, "myDiagramDiv",  // create a Diagram for the DIV HTML element
        {
        "linkingTool.isEnabled": false,  // invoked explicitly by drawLink function, below
        "linkingTool.direction": go.LinkingTool.ForwardsOnly,  // only draw "from" towards "to"
        "undoManager.isEnabled": true  // enable undo & redo
        });

    myDiagram.linkTemplate =
        $(go.Link,
          { routing: go.Link.AvoidsNodes, corner: 5 },
          $(go.Shape, { strokeWidth: 1.5 }),
          $(go.TextBlock,                                                                          // mujtabachang: This is a Link label
            new go.Binding("text", "text"),                                                        // mujtabachang: Text is attached to the text property in the link
            { segmentOffset: new go.Point(-10, -10), editable:true }                               // mujtabachang: Align the link text
            )
        );

    myDiagram.nodeTemplate =
        $(go.Node, "Auto",
        {

            // rearrange the link points evenly along the sides of the nodes as links are
            // drawn or reconnected -- these event handlers only make sense when the fromSpot
            // and toSpot are Spot.xxxSides
            linkConnected: function(node, link, port) {
              if (link.fromNode !== null) link.fromNode.invalidateConnectedLinks();
              if (link.toNode !== null) link.toNode.invalidateConnectedLinks();
            },
            linkDisconnected: function(node, link, port) {
              if (link.fromNode !== null) link.fromNode.invalidateConnectedLinks();
              if (link.toNode !== null) link.toNode.invalidateConnectedLinks();
            },
            locationSpot: go.Spot.Center
        },
        new go.Binding("location", "location", go.Point.parse).makeTwoWay(go.Point.stringify),
        $(go.Shape, "RoundedRectangle",
            {
              name: "SHAPE",  // named so that changeColor can modify it
              strokeWidth: 0,  // no border
              fill: "#d1bc8a",  // default fill color
              portId: "",
              // use the following property if you want users to draw new links
              // interactively by dragging from the Shape, and re-enable the LinkingTool
              // in the initialization of the Diagram
              //cursor: "pointer",
              fromSpot: go.Spot.AllSides, fromLinkable: true,
              fromLinkableDuplicates: true, fromLinkableSelfNode: true,
              toSpot: go.Spot.AllSides, toLinkable: true,
              toLinkableDuplicates: true, toLinkableSelfNode: true
            },
            new go.Binding("fill", "color").makeTwoWay()),
          $(go.TextBlock,
            {
              name: "TEXTBLOCK",  // named so that editText can start editing it
              margin: 7,
              // use the following property if you want users to interactively start
              // editing the text by clicking on it or by F2 if the node is selected:
              //editable: true,
              overflow: go.TextBlock.OverflowEllipsis,
              maxLines: 5
            },
            new go.Binding("text").makeTwoWay())
        );

      // a selected node shows an Adornment that includes both a blue border
      // and a row of Buttons above the node
      myDiagram.nodeTemplate.selectionAdornmentTemplate =
        $(go.Adornment, "Spot",
          $(go.Panel, "Auto",
            $(go.Shape, { stroke: "dodgerblue", strokeWidth: 0, fill: null }),
            $(go.Placeholder)
          ),
          $(go.Panel, "Horizontal",
            { alignment: go.Spot.Bottom, alignmentFocus: go.Spot.Top, name: "BUTTONPANEL" },
            $("Button",
            {
              alignment: go.Spot.TopRight,
              contextMenu:
                $("ContextMenu",
                  $("ContextMenuButton",
                    $(go.TextBlock, "Add Child"),
                    {
                      actionMove: dragNewNode,  // defined below, to support dragging from the button
                      _dragData: { text: "a Node", color: "#d1bc8a" },  // node data to copy
                      click: clickNewNode  // defined below, to support a click on the button
                    }
                  ),
                  $("ContextMenuButton",
                    $(go.TextBlock, "Add explanation"),
                    {
                      click: function(e, node) { e.diagram.commandHandler.copySelection(); }
                    }

                  ),
                ),
              click: function(e, nbutton) {
                e.diagram.commandHandler.showContextMenu(nbutton);
              }
              // this is unneeded -- context clicks aren't supposed to work on Buttons:
              //contextClick: function(e, nbutton) { e.handled = true; }
              // this is optional:
              //toolTip: $("ToolTip", $(go.TextBlock, "click for some commands"))
            },
            $(go.TextBlock, "+",
                { font: "bold 10pt sans-serif", desiredSize: new go.Size(15, 15), textAlign: "center" })
          ),
            $("Button",
              { click: editText },  // defined below, to support editing the text of the node
              $(go.Picture,
                { source: "600px-Black_pencil.svg.png", width: 15, height: 15})
            ),
            $("Button",
              {click: function(e, node) { e.diagram.commandHandler.copySelection();} },  // defined below, to support editing the text of the node
              $(go.Picture,
                { source: "copy.png", width: 15, height: 15})
            ),
            $("Button",
              {click: function(e, node) { e.diagram.commandHandler.pasteSelection();} },  // defined below, to support editing the text of the node
              $(go.Picture,
                { source: "paste.png", width: 15, height: 15})
            ),
            $("Button",
            {click: function(e, node) { e.diagram.commandHandler.deleteSelection();} },  // defined below, to support editing the text of the node
            $(go.Picture,
                { source: "trash.png", width: 15, height: 15})
            ),

            $("Button",
              { // drawLink is defined below, to support interactively drawing new links
                click: drawLink,  // click on Button and then click on target node
                actionMove: drawLink  // drag from Button to the target node
              },
              $(go.Shape,
                { geometryString: "M0 0 L8 0 8 12 14 12 M12 10 L14 12 12 14" })
            ),
          )
        );

      function editText(e, button) {
        var node = button.part.adornedPart;
        e.diagram.commandHandler.editTextBlock(node.findObject("TEXTBLOCK"));
      }

      // used by nextColor as the list of colors through which we rotate
      var myColors = ["lightgray", "lightblue", "lightgreen", "yellow", "orange", "pink"];

      // used by both the Button Binding and by the changeColor click function
      function nextColor(c) {
        var idx = myColors.indexOf(c);
        if (idx < 0) return "lightgray";
        if (idx >= myColors.length - 1) idx = 0;
        return myColors[idx + 1];
      }

      function changeColor(e, button) {
        var node = button.part.adornedPart;
        var shape = node.findObject("SHAPE");
        if (shape === null) return;
        node.diagram.startTransaction("Change color");
        shape.fill = nextColor(shape.fill);
        button["_buttonFillNormal"] = nextColor(shape.fill);  // update the button too
        node.diagram.commitTransaction("Change color");
      }

      function drawLink(e, button) {
        var node = button.part.adornedPart;
        var tool = e.diagram.toolManager.linkingTool;

        tool.archetypeLinkData  = e.diagram.model.copyLinkData({text:"Relation"});                //mujtabachang: Added default link text of "relation" when selecting link tool

        tool.startObject = node.port;
        e.diagram.currentTool = tool;
        tool.doActivate();
        var resultingLink = tool.doActivate();
      }

      // used by both clickNewNode and dragNewNode to create a node and a link
      // from a given node to the new node
      function createNodeAndLink(data, fromnode) {
        var diagram = fromnode.diagram;
        var model = diagram.model;
        var nodedata = model.copyNodeData(data);
        model.addNodeData(nodedata);
        var newnode = diagram.findNodeForData(nodedata);
        var linkdata = model.copyLinkData({text:"Relation"});                                       //mujtabachang: Added default link text of "relation"
        model.setFromKeyForLinkData(linkdata, model.getKeyForNodeData(fromnode.data));
        model.setToKeyForLinkData(linkdata, model.getKeyForNodeData(newnode.data));
        model.addLinkData(linkdata);
        diagram.select(newnode);
        return newnode;
      }

      // the Button.click event handler, called when the user clicks the "N" button
      function clickNewNode(e, button) {
        var data = button._dragData;
        if (!data) return;
        e.diagram.startTransaction("Create Node and Link");
        var fromnode = button.part.adornedPart;
        var newnode = createNodeAndLink(button._dragData, fromnode);
        newnode.location = new go.Point(fromnode.location.x + 200, fromnode.location.y);
        e.diagram.commitTransaction("Create Node and Link");
      }

      // the Button.actionMove event handler, called when the user drags within the "N" button
      function dragNewNode(e, button) {
        var tool = e.diagram.toolManager.draggingTool;
        if (tool.isBeyondDragSize()) {
          var data = button._dragData;
          if (!data) return;
          e.diagram.startTransaction("button drag");  // see doDeactivate, below
          var newnode = createNodeAndLink(data, button.part.adornedPart);
          newnode.location = e.diagram.lastInput.documentPoint;
          // don't commitTransaction here, but in tool.doDeactivate, after drag operation finished
          // set tool.currentPart to a selected movable Part and then activate the DraggingTool
          tool.currentPart = newnode;
          e.diagram.currentTool = tool;
          tool.doActivate();
        }
      }
      // using dragNewNode also requires modifying the standard DraggingTool so that it
      // only calls commitTransaction when dragNewNode started a "button drag" transaction;
      // do this by overriding DraggingTool.doDeactivate:
      var tool = myDiagram.toolManager.draggingTool;
      tool.doDeactivate = function() {
        // commit "button drag" transaction, if it is ongoing; see dragNewNode, above
        if (tool.diagram.undoManager.nestedTransactionNames.elt(0) === "button drag") {
          tool.diagram.commitTransaction();
        }
        go.DraggingTool.prototype.doDeactivate.call(tool);  // call the base method
      };


      myDiagram.model = new go.GraphLinksModel(
        [
          { key: 1, text: "Alpha", color: "#d1bc8a", location: "0 0" },
          { key: 2, text: "Beta", color: "#d1bc8a", location: "140 0" },
          { key: 3, text: "Gamma", color: "#d1bc8a", location: "0 140" },
          { key: 4, text: "Delta", color: "#d1bc8a", location: "140 140" }
        ],
        [
          { from: 1, to: 2, text:"Relation" }                                                         //mujtabachang: Added "Relation" as a default text for link text
        ]);

  }
