/*jslint onevar: true, undef: false, nomen: true, eqeqeq: true, plusplus: false, bitwise: true, regexp: true, newcap: true, immed: true  */

/**
 * Game of Life - JS & CSS
 * http://pmav.eu
 * 04/Sep/2010
 */

(function () {

  var stats = new Stats();
  stats.setMode( 0 ); // 0 FPS, 1 MS

  // align top-left
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.right = '0px';
  stats.domElement.style.bottom = '0px';
  stats.domElement.style.zIndex = '-999999';

  document.addEventListener("DOMContentLoaded", function() {
    document.body.appendChild( stats.domElement );
  });

  var GOL = {

    placeundead : false,

    columns : 180,
    rows : 86,
    cellSize : 4,
    
    waitTime: 0,
    generation : 0,

    running : false,

    // Clear state
    clear : {
      schedule : false
    },


    // Average execution times
    times : {
      algorithm : 0,
      gui : 0
    },


    // DOM elements
    element : {
      generation : null,
      steptime : null,
      alivecells : null,
      undeadcells : null,
      messages : {
        layout : null
      }
    },

    // Initial state
    initialState : '[]',

    // Grid style
    gridColor : '#F3F3F3',

    // Cell colors
    colors : 
    {
      dead : '#FFFFFF',
      undead : '#B5B5B5',
      alive : '#2626FF'
    },

    /**
         * On Load Event
         */
    init : function() {
      this.listLife.init();   // Reset/init algorithm
      this.keepDOMElements(); // Keep DOM References (getElementsById)
      this.canvas.init();     // Init canvas GUI
      this.registerEvents();  // Register event handlers
      this.prepare();
    },

    /**
     * Create a random pattern
     */
    randomState : function() {
      var i, aliveCells = (this.rows * this.columns) * 0.12;
      for (i = 0; i < aliveCells; i++) {
        this.listLife.addCell(this.helpers.random(0, this.columns - 1), this.helpers.random(0, this.rows - 1), this.listLife.actualState, false);
      }
      this.listLife.addCell(this.helpers.random(0, this.columns - 1), this.helpers.random(0, this.rows - 1), this.listLife.actualState,true);
      this.listLife.nextGeneration();
    },

    /**
     * Clean up actual state and prepare a new run
     */
    cleanUp : function() {
      this.listLife.init(); // Reset/init algorithm
      this.prepare();
    },

    /**
     * Prepare DOM elements and Canvas for a new run
     */
    prepare : function() {
      this.generation = this.times.algorithm = this.times.gui = 0;
      this.mouseDown = this.clear.schedule = false;

      this.element.generation.innerHTML = '0';
      this.element.alivecells.innerHTML = '0';
      this.element.undeadcells.innerHTML = '0';
      this.element.steptime.innerHTML = '0 / 0 (0 / 0)';

      this.canvas.clearWorld(); // Reset GUI
      this.canvas.drawWorld(); // Draw State
    },

    /**
     * keepDOMElements
     * Save DOM references for this session (one time execution)
     */
    keepDOMElements : function() {
      this.element.generation = document.getElementById('generation');
      this.element.steptime = document.getElementById('steptime');
      this.element.alivecells = document.getElementById('alivecells');
      this.element.undeadcells = document.getElementById('undeadcells');
      this.element.messages.layout = document.getElementById('layoutMessages');
    },

    /**
     * registerEvents
     * Register event handlers for this session (one time execution)
     */
    registerEvents : function() {

      // Keyboard Events
      this.helpers.registerEvent(document.body, 'keyup', this.handlers.keyboard, false);

      // Controls
      this.helpers.registerEvent(document.getElementById('buttonRun'), 'click', this.handlers.buttons.run, false);
      this.helpers.registerEvent(document.getElementById('buttonStep'), 'click', this.handlers.buttons.step, false);
      this.helpers.registerEvent(document.getElementById('buttonClear'), 'click', this.handlers.buttons.clear, false);

      // Layout
      this.helpers.registerEvent(document.getElementById('buttonUndead'), 'click', this.handlers.buttons.undead, false);
      this.helpers.registerEvent(document.getElementById('buttonAlive'), 'click', this.handlers.buttons.alive, false);
    },


    /**
     * Run Next Step
     */
    nextStep : function() {
      var i, x, y, r, cells, aliveCellNumber, undeadCellNumber, algorithmTime, guiTime;

      // Algorithm run

      algorithmTime = (new Date());

      cells = GOL.listLife.nextGeneration();
      aliveCellNumber = cells[0];
      undeadCellNumber = cells[1];

      algorithmTime = (new Date()) - algorithmTime;


      // Canvas run

      guiTime = (new Date());

      for (i = 0; i < GOL.listLife.redrawList.length; i++) {
        x = GOL.listLife.redrawList[i][0];
        y = GOL.listLife.redrawList[i][1];

        if (GOL.listLife.redrawList[i][2] === 1) {
          GOL.canvas.changeCelltoAlive(x, y);
        } else if (GOL.listLife.redrawList[i][2] === 2) {
          GOL.canvas.changeCelltoUndead(x, y);
        } else {
          GOL.canvas.changeCelltoDead(x, y);
        }
      }

      guiTime = (new Date()) - guiTime;

      // Running Information
      GOL.generation++;
      GOL.element.generation.innerHTML = GOL.generation;
      GOL.element.alivecells.innerHTML = aliveCellNumber;
      GOL.element.undeadcells.innerHTML = undeadCellNumber;

      r = 1.0/GOL.generation;
      GOL.times.algorithm = (GOL.times.algorithm * (1 - r)) + (algorithmTime * r);
      GOL.times.gui = (GOL.times.gui * (1 - r)) + (guiTime * r);
      GOL.element.steptime.innerHTML = algorithmTime + ' / '+guiTime+' ('+Math.round(GOL.times.algorithm) + ' / '+Math.round(GOL.times.gui)+')';

      // Flow Control
      if (GOL.running) {
        stats.begin();
        window.requestAnimationFrame(GOL.nextStep);
        stats.end();
      } else {
        if (GOL.clear.schedule) {
          GOL.cleanUp();
        }
      }
    },


    /** ****************************************************************************************************************************
     * Event Handlers
     */
    handlers : {

      mouseDown : false,
      lastX : 0,
      lastY : 0,


      /**
       *
       */
      canvasMouseDown : function(event) {
        var position = GOL.helpers.mousePosition(event);
        GOL.canvas.switchCell(position[0], position[1]);
        GOL.handlers.lastX = position[0];
        GOL.handlers.lastY = position[1];
        GOL.handlers.mouseDown = true;
      },


      /**
       *
       */
      canvasMouseUp : function() {
        GOL.handlers.mouseDown = false;
      },


      /**
       *
       */
      canvasMouseMove : function(event) {
        if (GOL.handlers.mouseDown) {
          var position = GOL.helpers.mousePosition(event);
          if ((position[0] !== GOL.handlers.lastX) || (position[1] !== GOL.handlers.lastY)) {
            GOL.canvas.switchCell(position[0], position[1]);
            GOL.handlers.lastX = position[0];
            GOL.handlers.lastY = position[1];
          }
        }
      },


      /**
       *
       */
      keyboard : function(e) {
        var event = e;
        if (!event) {
          event = window.event;
        }

        if (event.keyCode === 67) { // Key: C
          GOL.handlers.buttons.clear();
        } else if (event.keyCode === 82 ) { // Key: R
          GOL.handlers.buttons.run();
        } else if (event.keyCode === 83 ) { // Key: S
          GOL.handlers.buttons.step();
        }
      },


      buttons : {

        /**
         * Button Handler - Run
         */
        run : function() {
          GOL.running = !GOL.running;
          if (GOL.running) {
            GOL.nextStep();
            document.getElementById('buttonRun').value = 'Stop';
          } else {
            document.getElementById('buttonRun').value = 'Run';
          }
        },


        /**
         * Button Handler - Next Step - One Step only
         */
        step : function() {
          if (!GOL.running) {
            GOL.nextStep();
          }
        },


        /**
         * Button Handler - Clear World
         */
        clear : function() {
          if (GOL.running) {
            GOL.clear.schedule = true;
            GOL.running = false;
            document.getElementById('buttonRun').value = 'Run';
          } else {
            GOL.cleanUp();
          }
        },
        
        undead : function() {
          GOL.placeundead = true;
        },

        alive : function() {
          GOL.placeundead = false;
        }
      }
    },

    /** ****************************************************************************************************************************
     *
     */
    canvas: {

      context : null,
      width : null,
      height : null,
      age : null,
      cellSize : null,
      cellSpace : null,


      /**
       * init
       */
      init : function() {

        this.canvas = document.getElementById('canvas');
        this.context = this.canvas.getContext('2d');

        this.cellSize = GOL.cellSize;
        this.cellSpace = 1;

        GOL.helpers.registerEvent(this.canvas, 'mousedown', GOL.handlers.canvasMouseDown, false);
        GOL.helpers.registerEvent(document, 'mouseup', GOL.handlers.canvasMouseUp, false);
        GOL.helpers.registerEvent(this.canvas, 'mousemove', GOL.handlers.canvasMouseMove, false);

        this.clearWorld();
      },


      /**
       * clearWorld
       */
      clearWorld : function () {
        var i, j;
      },


      /**
       * drawWorld
       */
      drawWorld : function() {
        var i, j;

        // Dynamic canvas size
        this.width = this.width + (this.cellSpace * GOL.columns) + (this.cellSize * GOL.columns);
        this.canvas.setAttribute('width', this.width);

        this.height = this.height + (this.cellSpace * GOL.rows) + (this.cellSize * GOL.rows);
        this.canvas.setAttribute('height', this.height);

        // Fill background
        this.context.fillStyle = GOL.colors.dead;
        this.context.fillRect(0, 0, this.width, this.height);
      },

      /**
       * drawCell
       */
      drawCell : function (i, j, state) {
        switch(state){
        case 0:
          this.context.fillStyle = GOL.colors.dead;
          break;
        case 1:
          this.context.fillStyle = GOL.colors.alive;
          break;
        case 2:
          this.context.fillStyle = GOL.colors.undead;
          break
        }
        this.context.fillRect(this.cellSpace + (this.cellSpace * i) + (this.cellSize * i), this.cellSpace + (this.cellSpace * j) + (this.cellSize * j), this.cellSize, this.cellSize);
      },


      /**
       * switchCell
       */
      switchCell : function(i, j) {
        if(!GOL.listLife.isAliveOrUndead(i, j)){
          if(GOL.placeundead) {
            GOL.listLife.addCell(i, j, GOL.listLife.actualState, true);
            this.changeCelltoUndead(i, j);
          } else {
            GOL.listLife.addCell(i, j, GOL.listLife.actualState, false);
            this.changeCelltoAlive(i, j);
          }
        }else {
          GOL.listLife.removeCell(i, j, GOL.listLife.actualState);
          this.changeCelltoDead(i, j);
        }
      },

      changeCelltoDead : function(i, j) {
        if (i >= 0 && i < GOL.columns && j >=0 && j < GOL.rows) {
          this.drawCell(i, j, 0);
        }
      },

      changeCelltoAlive : function(i, j) {
        if (i >= 0 && i < GOL.columns && j >=0 && j < GOL.rows) {
          this.drawCell(i, j, 1);
        }
      },

      changeCelltoUndead : function(i, j) {
        if (i >= 0 && i < GOL.columns && j >=0 && j < GOL.rows) {
          this.drawCell(i, j, 2);
        }
      }
    },


    /** ****************************************************************************************************************************
     *
     */
    listLife : {

      actualState : [],
      redrawList : [],

      /**
       *
       */
      init : function () {
        this.actualState = [];
      },

      nextGeneration : function() {
        var x, y, i, j, m, n, key, t1, t2, undead= 0, alive = 0, neighbours, deadNeighbours, allDeadNeighbours = {}, newState = [];
        this.redrawList = [];

        for (i = 0; i < this.actualState.length; i++) {
          this.topPointer = 1;
          this.bottomPointer = 1;

          for (j = 1; j < this.actualState[i].length; j++) {
            x = this.actualState[i][j];
            y = this.actualState[i][0];
            isUndead = this.actualState[i][j][0];

            if(isUndead){
              this.addCell(x, y, newState, true);
              this.redrawList.push([x, y, 2]); // infect cell
              undead++; 
              continue;
            }

            // Possible dead neighbours
            deadNeighbours = [[x-1, y-1, 1], [x, y-1, 1], [x+1, y-1, 1], [x-1, y, 1], [x+1, y, 1], [x-1, y+1, 1], [x, y+1, 1], [x+1, y+1, 1]];

            // Get number of alive neighbours and remove alive neighbours from deadNeighbours
            neighbours = this.getNeighboursFromAlive(x, y, i, deadNeighbours);
            livingNeighbours = neighbours[0];
            undeadNeighbours = neighbours[1];

            // Join dead neighbours to check list
            for (m = 0; m < 8; m++) {
              if (deadNeighbours[m] !== undefined) {
                key = deadNeighbours[m][0] + ',' + deadNeighbours[m][1]; // Create hashtable key

                if (allDeadNeighbours[key] === undefined) {
                  allDeadNeighbours[key] = 1;
                } else {
                  allDeadNeighbours[key]++;
                }
              }
            }

            if(undeadNeighbours > 0){
              this.addCell(x, y, newState, true);
              this.redrawList.push([x, y, 2]); // infect cell
              undead++;
              continue;
            }

            if (!(livingNeighbours === 0 || livingNeighbours === 1 || livingNeighbours > 3)) {
              this.addCell(x, y, newState, false);
              alive++;
              this.redrawList.push([x, y, 1]); // Keep alive
            } else {
              this.redrawList.push([x, y, 0]); // Kill cell
            }
          }
        }

        // Process dead neighbours
        for (key in allDeadNeighbours) {
          if (allDeadNeighbours[key] === 3) { // Add new Cell
            key = key.split(',');
            t1 = parseInt(key[0], 10);
            t2 = parseInt(key[1], 10);

            this.addCell(t1, t2, newState);
            alive++;
            this.redrawList.push([t1, t2, 1]);
          }
        }
        this.actualState = newState;
        return alive;
      },

      topPointer : 1,
      middlePointer : 1,
      bottomPointer : 1,

      getNeighboursFromAlive : function (x, y, i, possibleNeighboursList) {
        var living = 0, undead = 0, k;

        // Top
        if (this.actualState[i-1] !== undefined) {
          if (this.actualState[i-1][0] === (y - 1)) {
            for (k = this.topPointer; k < this.actualState[i-1].length; k++) {
            
              if (this.actualState[i-1][k][0] >= (x-1) ) {

                if (this.actualState[i-1][k][0] === (x - 1)) {
                  possibleNeighboursList[0] = undefined;
                  this.topPointer = k + 1;

                  if(this.actualState[i-1][k][1]){
                    undead++;
                  }else{
                    living++;
                  }
                }

                if (this.actualState[i-1][k][0] === x) {
                  possibleNeighboursList[1] = undefined;
                  this.topPointer = k;
                
                  if(this.actualState[i-1][k][1]){
                    undead++;
                  }else{
                    living++;
                  }
                }

                if (this.actualState[i-1][k][0] === (x + 1)) {
                  possibleNeighboursList[2] = undefined;

                  if (k == 1) {
                    this.topPointer = 1;
                  } else {
                    this.topPointer = k - 1;
                  }

                  if(this.actualState[i-1][k][1]){
                    undead++;
                  }else{
                    living++;
                  }
                }

                if (this.actualState[i-1][k][0] > (x + 1)) {
                  break;
                }
              }
            }
          }
        }

        // Middle
        for (k = 1; k < this.actualState[i].length; k++) {
          if (this.actualState[i][k][0] >= (x - 1)) {

            if (this.actualState[i][k][0] === (x - 1)) {
              possibleNeighboursList[3] = undefined;
            
              if(this.actualState[i][k][1]){
                undead++;
              }else{
                living++;
              }
            }

            if (this.actualState[i][k][0] === (x + 1)) {
              possibleNeighboursList[4] = undefined;
            
              if(this.actualState[i][k][1]){
                undead++;
              }else{
                living++;
              }
            }

            if (this.actualState[i][k][0] > (x + 1)) {
              break;
            }
          }
        }

        // Bottom
        if (this.actualState[i+1] !== undefined) {
          if (this.actualState[i+1][0] === (y + 1)) {
            for (k = this.bottomPointer; k < this.actualState[i+1].length; k++) {
              if (this.actualState[i+1][k][0] >= (x - 1)) {

                if (this.actualState[i+1][k][0] === (x - 1)) {
                  possibleNeighboursList[5] = undefined;
                  this.bottomPointer = k + 1;
            
                  if(this.actualState[i+1][k][1]){
                    undead++;
                  }else{
                    living++;
                  }
                }

                if (this.actualState[i+1][k][0] === x) {
                  possibleNeighboursList[6] = undefined;
                  this.bottomPointer = k;
                
                  if(this.actualState[i+1][k][1]){
                    undead++;
                  }else{
                    living++;
                  }
                }

                if (this.actualState[i+1][k][0] === (x + 1)) {
                  possibleNeighboursList[7] = undefined;

                  if (k == 1) {
                    this.bottomPointer = 1;
                  } else {
                    this.bottomPointer = k - 1;
                  }

                  if(this.actualState[i+1][k][1]){
                    undead++;
                  }else{
                    living++;
                  }
                }

                if (this.actualState[i+1][k][0] > (x + 1)) {
                  break;
                }
              }
            }
          }
        }
        return [living, undead];
      },


      /**
       *
       */
      isAliveOrUndead : function(x, y) {
        var i, j;
        for (i = 0; i < this.actualState.length; i++) {
          if (this.actualState[i][0] === y) {
            for (j = 1; j < this.actualState[i].length; j++) {
              if (this.actualState[i][j] === x) {
                return true;
              }
            }
          }
        }
        return false;
      },

      /**
       *
       */
      removeCell : function(x, y, state) {
        var i, j;

        for (i = 0; i < state.length; i++) {
          if (state[i][0] === y) {

            if (state[i].length === 2) { // Remove all Row
              state.splice(i, 1);
            } else { // Remove Element
              for (j = 1; j < state[i].length; j++) {
                if (state[i][j] === x) {
                  state[i].splice(j, 1);
                }
              }
            }
          }
        }
      },


      /**
       *
       */
      addCell : function(x, y, state, undead) {
        if (state.length === 0) {
          state.push([y, [x, undead]]);
          return;
        }

        var k, n, m, tempRow, newState = [], added;

        if (y < state[0][0]) { // Add to Head
          newState = [y,[x, undead]];
          for (k = 0; k < state.length; k++) {
            newState[k+1] = state[k];
          }

          for (k = 0; k < newState.length; k++) {
            state[k] = newState[k];
          }

          return;

        } else if (y > state[state.length - 1][0]) { // Add to Tail
          state[state.length] = [y, [x, undead]];
          return;

        } else { // Add to Middle

          for (n = 0; n < state.length; n++) {
            if (state[n][0] === y) { // Level Exists
              tempRow = [];
              added = false;
              for (m = 1; m < state[n].length; m++) {
                if ((!added) && (x < state[n][m][0])) {
                  tempRow.push([x, undead]);
                  added = !added;
                }
                tempRow.push(state[n][m]);
              }
              tempRow.unshift(y);
              if (!added) {
                tempRow.push([x, undead]);
              }
              state[n] = tempRow;
              return;
            }

            if (y < state[n][0]) { // Create Level
              newState = [];
              for (k = 0; k < state.length; k++) {
                if (k === n) {
                  newState[k] = [y,[x,undead]];
                  newState[k+1] = state[k];
                } else if (k < n) {
                  newState[k] = state[k];
                } else if (k > n) {
                  newState[k+1] = state[k];
                }
              }

              for (k = 0; k < newState.length; k++) {
                state[k] = newState[k];
              }

              return;
            }
          }
        }
      }
    },


    /** ****************************************************************************************************************************
     *
     */
    helpers : {
      urlParameters : null, // Cache


      /**
       * Return a random integer from [min, max]
       */
      random : function(min, max) {
        return min <= max ? min + Math.round(Math.random() * (max - min)) : null;
      },


      /**
       * Get URL Parameters
       */
      getUrlParameter : function(name) {
        if (this.urlParameters === null) { // Cache miss
          var hash, hashes, i;

          this.urlParameters = [];
          hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');

          for (i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            this.urlParameters.push(hash[0]);
            this.urlParameters[hash[0]] = hash[1];
          }
        }

        return this.urlParameters[name];
      },


      /**
       * Register Event
       */
      registerEvent : function (element, event, handler, capture) {
        if (/msie/i.test(navigator.userAgent)) {
          element.attachEvent('on' + event, handler);
        } else {
          element.addEventListener(event, handler, capture);
        }
      },


      /**
       *
       */
      mousePosition : function (e) {
        // http://www.malleus.de/FAQ/getImgMousePos.html
        // http://www.quirksmode.org/js/events_properties.html#position
        var event, x, y, domObject, posx = 0, posy = 0, top = 0, left = 0, cellSize = GOL.cellSize + 1;

        event = e;
        if (!event) {
          event = window.event;
        }

        if (event.pageX || event.pageY) 	{
          posx = event.pageX;
          posy = event.pageY;
        } else if (event.clientX || event.clientY) 	{
          posx = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
          posy = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }

        domObject = event.target || event.srcElement;

        while ( domObject.offsetParent ) {
          left += domObject.offsetLeft;
          top += domObject.offsetTop;
          domObject = domObject.offsetParent;
        }

        domObject.pageTop = top;
        domObject.pageLeft = left;

        x = Math.ceil(((posx - domObject.pageLeft)/cellSize) - 1);
        y = Math.ceil(((posy - domObject.pageTop)/cellSize) - 1);

        return [x, y];
      }
    }

  };


  /**
   * Init on 'load' event
   */
  GOL.helpers.registerEvent(window, 'load', function () {
    GOL.init();
  }, false);

}());
