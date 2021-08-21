<template>
  <!-- prettier-ignore -->
  <div
    class="quantum-document"
    :class="'theme-paper-' + document.options.paperStyle"
    ref="documentElement"
    tabindex="-1"
    :style="{
      '--grid-cell-size-x': `${document.options.gridCellSize.x}px`,
      '--grid-cell-size-y': `${document.options.gridCellSize.y}px`,
      'min-width': `${pages.width.value}mm`,
      'min-height': `calc(${pages.height.value}mm * ${pages.pageCount.value})`,
    }"
    @pointerdown="
      grid.pointerDown($event);
      elementDrag.removeDragging();
    "
    @contextmenu="
      (e) => {
        e.preventDefault()
        return false
      }
    "
    @paste="clipboard.paste"
    @focus="documentInputElement.focus({ preventScroll: true })"
  >
    <!-- prettier-ignore -->
    <textarea
      class="input-element"
      ref="documentInputElement"
      autofocus
      autocomplete="off"
      autocorrect="off"
      spellcheck="false"
      @input="grid.textInput($event)"
      @keydown="grid.keydown($event)"
      @keyup="grid.keyup($event)"
      @focus="
        document.setSelection();
        grid.showCrosshair.value = true;
      "
      @blur="grid.showCrosshair.value = false;"
    ></textarea>

    <div class="grid-crosshair" :style="grid.gridToStyle(grid.crosshairPosition.value)" v-show="grid.showCrosshair.value">+</div>
    <div v-for="page in pages.pageCount.value - 1" class="page-divider" :key="page" :style="{ top: `calc(${pages.height.value}mm * ${page})` }">
      <span class="page-number">{{ page }}</span>
      <span class="next-page-number">{{ page + 1 }}</span>
    </div>
    <div
      class="quantum-block hoverable"
      v-for="element in document.elements"
      :key="element.id"
      :id="element.id"
      :style="grid.gridToStyle(element.position.value)"
      :class="{ selected: element.selected.value }"
      @mousedown="elementDrag.makeDraggable"
    >
      <component
        :is="getTypeComponent(element.typeName)"
        class="quantum-element"
        :modelGetter="() => element"
        @focused-element-commands="(value) => (focusedElementCommands.commands.value = value)"
        @move-cursor-out="(value) => grid.moveCrosshairOut(element, value)"
        @delete-element="document.deleteElement(element)"
      ></component>
    </div>
  </div>
  <!-- <a-button @click="pages.addPage()">+ Page</a-button> -->
</template>
<script lang="ts">
import { defineComponent, readonly, ref, Ref, nextTick, unref, onMounted, inject, provide, watch } from 'vue'
import { useDocument, UseQuantumDocument, QuantumDocumentElementTypes } from '../model/document/document'
import ExpressionElement, { ExpressionElementType } from './elements/ExpressionElement.vue'
import ScopeElement, { ScopeElementType } from './elements/ScopeStartElement.vue'
import { useFocusedElementCommands, ElementCommands } from './elements/element-commands'
import { Vector2 } from '../model/vectors'
import { QuantumElement, JsonType } from '../model/document/document-element'
import { useUI } from './ui'
import interact from 'interactjs'
import Moveable from 'moveable'
import Selecto from 'selecto'

function useClipboard<T extends QuantumDocumentElementTypes>(document: UseQuantumDocument<T>) {
  function cut(ev: ClipboardEvent) {}
  function copy(ev: ClipboardEvent) {}
  function paste(ev: ClipboardEvent) {}
  return {
    cut,
    copy,
    paste,
  }
}

function useGrid<T extends QuantumDocumentElementTypes>(
  document: UseQuantumDocument<T>,
  inputElement: Ref<HTMLElement | undefined>,
  focusedElementCommands: Ref<ElementCommands | undefined>
) {
  const crosshairPosition = ref<Vector2>(new Vector2(2, 10))
  const showCrosshair = ref(true)

  function gridToStyle(gridPosition: Vector2 | Ref<Vector2>) {
    let pos = unref(gridPosition)
    return {
      left: pos.x * document.options.gridCellSize.x + 'px',
      top: pos.y * document.options.gridCellSize.y + 'px',
    }
  }

  function pointerDown(ev: PointerEvent) {
    // console.log('pointerdown', ev)
    if (ev.target == ev.currentTarget) {
      crosshairPosition.value = new Vector2(
        Math.round(ev.offsetX / document.options.gridCellSize.x),
        Math.round(ev.offsetY / document.options.gridCellSize.y)
      )
      if (ev.button == 2) {
        // context menu
      }
    }
  }

  function textInput(ev: InputEvent) {
    if (ev.isComposing) return

    if (ev.data) {
      let element = document.createElement(ExpressionElementType.typeName, {
        position: crosshairPosition.value,
        resizable: false,
      })
      document.setFocus(element)
      nextTick(() => {
        focusedElementCommands.value?.moveToStart?.()
        focusedElementCommands.value?.insert?.(ev.data + '')
      })
    }

    if (ev.currentTarget) {
      ;(ev.currentTarget as HTMLTextAreaElement).value = ''
    }
  }

  function keydown(ev: KeyboardEvent) {
    if (ev.isComposing) return

    let direction =
      {
        ArrowLeft: new Vector2(-1, 0),
        ArrowRight: new Vector2(1, 0),
        ArrowUp: new Vector2(0, -1),
        ArrowDown: new Vector2(0, 1),
      }[ev.key] ?? Vector2.zero

    crosshairPosition.value = crosshairPosition.value.add(direction)
    focusUnderCrosshair()
  }

  function keyup(ev: KeyboardEvent) {
    if (ev.isComposing) return
  }

  function moveCrosshairOut(element: QuantumElement, direction: Vector2) {
    let pos = element.position.value.add(new Vector2(direction.x > 0 ? element.size.value.x : 0, direction.y > 0 ? element.size.value.y : 0))
    crosshairPosition.value = pos.add(direction)
    focusUnderCrosshair()
  }

  function focusUnderCrosshair() {
    // Focus crosshair
    inputElement.value?.focus({ preventScroll: true })

    // Focus element under crosshair
    let blockToFocus = document.getElementAt(crosshairPosition.value)
    document.setFocus(blockToFocus)
  }

  return {
    crosshairPosition: readonly(crosshairPosition),
    showCrosshair,
    gridToStyle,
    pointerDown,
    textInput,
    keydown,
    keyup,

    moveCrosshairOut,
    focusUnderCrosshair,
  }
}

function useElementSelection<T extends QuantumDocumentElementTypes>(quantumDocument: UseQuantumDocument<T>) {
  const selecto = new Selecto({
    // The container to add a selection element
    container: document.body,
    // Selecto's root container (No transformed container. (default: null)
    rootContainer: null,
    // The area to drag selection element (default: container)
    dragContainer: Element,
    // Targets to select. You can register a queryselector or an Element.
    selectableTargets: ['.target', document.querySelector('.target2')],
    // Whether to select by click (default: true)
    selectByClick: true,
    // Whether to select from the target inside (default: true)
    selectFromInside: true,
    // After the select, whether to select the next target with the selected target (deselected if the target is selected again).
    continueSelect: false,
    // Determines which key to continue selecting the next target via keydown and keyup.
    toggleContinueSelect: 'shift',
    // The container for keydown and keyup events
    keyContainer: window,
    // The rate at which the target overlaps the drag area to be selected. (default: 100)
    hitRate: 100,
  })
}

function useElementDrag<T extends QuantumDocumentElementTypes>(quantumDocument: UseQuantumDocument<T>, pages) {
  // TODO: Investigate
  // I got stuff to break by adding a few blocks, moving them around and stuff
  // Tell interactjs to make every .quantum-block interactive. This includes the ones that will get added in the future
  interact('.quantum-block')
    .draggable({
      ignoreFrom: '.quantum-element',
      modifiers: [
        interact.modifiers.snap({
          targets: [interact.snappers.grid({ x: quantumDocument.options.gridCellSize.x, y: quantumDocument.options.gridCellSize.y })],
          range: Infinity,
          relativePoints: [{ x: 0, y: 0 }],
          offset: 'parent',
        }),
        interact.modifiers.restrict({
          restriction: '.quantum-document',
          elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
          // endOnly: true,
        }),
      ],
      inertia: false,
      autoScroll: true,
    })
    .on('down', (event) => {
      event.target?.classList.add('dragging')
    })
    .on('dragmove', (event) => {
      const quantumElement = quantumDocument.getElementById(event.target.id)
      let delta = new Vector2(event.dx / quantumDocument.options.gridCellSize.x, event.dy / quantumDocument.options.gridCellSize.y)
      let newPos = quantumElement?.position.value.add(delta)
      if (newPos) quantumElement?.setPosition(newPos)
    })
    .on('dragend', (event) => {
      event.target?.classList.remove('dragging')
      pages.updatePageCount()
    })
}

function useNewElementDrag<T extends QuantumDocumentElementTypes>(quantumDocument: UseQuantumDocument<T>, pages) {
  console.log('drag', document.body, document.querySelector('.quantum-block'))

  const moveable = new Moveable(document.body, {
    target: document.querySelector('.quantum-block'),
    // className: 'quantum-block',
    // If the container is null, the position is fixed. (default: parentElement(document.body))
    container: document.body,
    draggable: true,
    padding: { left: 0, top: -1, right: -1, bottom: -1 },
    scrollable: true,
    resizable: false,
    scalable: false,
    rotatable: false,
    warpable: false,
    // Enabling pinchable lets you use events that
    // can be used in draggable, resizable, scalable, and rotateable.
    pinchable: false, // ["resizable", "scalable", "rotatable"]
    origin: false,
    keepRatio: true,
    // Resize, Scale Events at edges.
    edge: false,
    throttleDrag: quantumDocument.options.gridCellSize.x,
    throttleResize: 0,
    throttleScale: 0,
    throttleRotate: 0,
  })
  /* draggable */
  moveable
    .on('dragStart', ({ target, clientX, clientY }) => {
      console.log('onDragStart', target)
      // target?.classList.remove('hoverable')
      target?.classList.add('dragging')
      // target.style.cursor = 'move'
      // target.setAttribute('style', 'cursor: move !important')
      // target.parentElement.style.cursor = 'move'
      // window.setCursor('move')

      document.documentElement.setAttribute('class', 'dragging')
    })
    .on('drag', ({ target, transform, left, top, right, bottom, beforeDelta, beforeDist, delta, dist, clientX, clientY }) => {
      console.log('onDrag left, top', left, top, delta, dist)
      const quantumElement = quantumDocument.getElementById(target.id)
      let deltaVector = new Vector2(delta[0] / quantumDocument.options.gridCellSize.x, delta[1] / quantumDocument.options.gridCellSize.y)
      let newPos = quantumElement?.position.value.add(deltaVector)
      if (newPos) quantumElement?.setPosition(newPos)
    })
    .on('dragEnd', ({ target, isDrag, clientX, clientY }) => {
      console.log('onDragEnd', target, isDrag)
      // target?.classList.add('hoverable')
      target?.classList.remove('dragging')
      // target.style.cursor = 'unset'
      // target.parentElement.style.cursor = 'unset'
      // element.releaseCapture()
    })

  // function makeMovable() {
  //   moveable.target = document.querySelectorAll('.quantum-block')
  // }

  function makeDraggable(e) {
    console.log(e)
    // moveable.target = e.target
    // if (!moveable.isMoveableElement(e.target)) {
    // moveable.dragStart(e)
    // }
    moveable.setState(
      {
        target: e.target,
      },
      () => {
        moveable.dragStart(e)
      }
    )
  }

  function removeDragging() {
    moveable.target = undefined
  }

  // watch(quantumDocument.elements, (value) => {
  //   makeMovable()
  // })

  return {
    makeDraggable,
    removeDragging,
  }
}

function usePages<T extends QuantumDocumentElementTypes>(quantumDocument: UseQuantumDocument<T>) {
  const pageCount = ref(1)
  const sheetSizes: any = {
    A4: { width: 210, height: 297 },
    Letter: { width: 216, height: 279 },
    Legal: { width: 216, height: 356 },
  }

  const width = ref(0)
  const height = ref(0)

  function getPageNumberOfPosition(y: number) {
    // (1in = 96px = 2.54cm = 25.4mm)
    const yPos = (y * quantumDocument.options.gridCellSize.y * (25.4 / 96)) / sheetSizes[quantumDocument.options.paperSize].height
    return yPos
  }

  function lowestElementPosition(arr) {
    // The largest number at first should be the first element or null for empty array
    var largest = arr[0].position.value.y || null
    // Current number, handled by the loop
    var number = null
    for (var i = 0; i < arr.length; i++) {
      // Update current number
      number = Number(arr[i].position.value.y)
      // Compares stored largest number with current number, stores the largest one
      largest = Math.max(largest, number)
    }

    return largest
  }

  function updatePageCount() {
    const maxElPos = getPageNumberOfPosition(lowestElementPosition(quantumDocument.elements))
    pageCount.value = Math.ceil(maxElPos + 0.1)
  }

  function addPage() {
    pageCount.value += 1
  }

  // Element Added/Removed
  watch(quantumDocument.elements, (value) => {
    updatePageCount()
  })

  watch(
    () => quantumDocument.options.paperSize,
    (value) => {
      width.value = sheetSizes[quantumDocument.options.paperSize].width
      height.value = sheetSizes[quantumDocument.options.paperSize].height
    }
  )

  width.value = sheetSizes[quantumDocument.options.paperSize].width
  height.value = sheetSizes[quantumDocument.options.paperSize].height

  return {
    pageCount,
    updatePageCount,
    addPage,
    width, //: sheetSizes[quantumDocument.options.paperSize].width, //getSizeOfPaper(quantumDocument.options.paperSize).width,
    height, //: sheetSizes[quantumDocument.options.paperSize].height, //getSizeOfPaper(quantumDocument.options.paperSize).height,
  }
}

/**
 * To say which document-element type corresponds to which Vue.js component
 */
type TypeComponents<T extends UseQuantumDocument<any>> = T extends UseQuantumDocument<infer U> ? { [key in keyof U]: any } : any

export default defineComponent({
  components: {
    ExpressionElement,
    ScopeElement,
  },
  emits: {
    'quantum-document': (value: UseQuantumDocument<any>) => true,
  },
  setup(props, context) {
    const document = useDocument({ [ExpressionElementType.typeName]: ExpressionElementType, [ScopeElementType.typeName]: ScopeElementType })

    // let z = new document.elementTypes['scope-element'].elementType({})

    const typeComponents: TypeComponents<typeof document> = {
      [ExpressionElementType.typeName]: ExpressionElement,
      [ScopeElementType.typeName]: ScopeElement,
    }

    const documentElement = ref<HTMLElement>()
    const documentInputElement = ref<HTMLElement>()

    const focusedElementCommands = useFocusedElementCommands()
    const grid = useGrid(document, documentInputElement, focusedElementCommands.commands)
    const pages = usePages(document)
    const clipboard = useClipboard(document)
    // const selection = useElementSelection(document)
    // const elementDrag = useElementDrag(document, pages)
    const elementDrag = useNewElementDrag(document, pages)

    function log(ev: any) {
      console.log(ev)
    }

    function getTypeComponent(typeName: string) {
      return (typeComponents as any)[typeName]
    }

    function serialize() {
      let serializedData = document.serializeDocument()
      // return JSON.stringify(serializedData)
      return serializedData
    }

    function deserialize(documentObject: JsonType) {
      // convert from string here : JSON.parse()
      // let documentObject = JSON.parse(serializedDocument)
      document.deserializeDocument(documentObject)
    }

    context.emit('quantum-document', document)

    return {
      document,
      documentElement,
      documentInputElement,

      focusedElementCommands,
      grid,
      pages,
      clipboard,
      elementDrag,

      getTypeComponent,
      log,

      serialize,
      deserialize,
    }
  },
})
</script>

<style scoped>
/*TODO: Use this https://github.com/vuejs/rfcs/blob/master/active-rfcs/0043-sfc-style-variables.md for the grid size and stuff? */
.theme-paper-standard {
  /* Standard Grid Papaer Style */
  --color: white;
  --grid-color: rgba(71, 162, 223, 0.26);
}
.theme-paper-engineer {
  /* Engineering Paper Style */
  --color: #fffdf8;
  --grid-color: #c5dec467;
}
.quantum-document {
  background-color: var(--color);
  --selected-background-color: rgba(68, 148, 202, 0.24);
  --selected-color: rgba(57, 131, 180, 0.459);
  background-size: var(--grid-cell-size-x) var(--grid-cell-size-y);
  background-image: linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px);
  position: relative;
  /* touch-action: none; */

  /* width: 100%;
  min-height: 100%; */

  /* A4 Letter Size */
  /* width: 21cm; */
  /* min-height: 29.7cm; */
}

.quantum-block {
  position: absolute;
  min-width: 50px;
  padding: 4px;
  /* margin: 1px; */

  /* box-sizing: border-box;
  -moz-box-sizing: border-box;
  -webkit-box-sizing: border-box; */
}

/* .quantum-block:hover {
  border: 1px solid var(--selected-color);
  margin: 0px;
} */
.quantum-block.hoverable:hover {
  /* border: 1px solid var(--selected-color); */
  /* margin: 0px; */
  box-shadow: 0px 0px 0px 1px var(--selected-color) inset;
  cursor: move;
}
.quantum-block.dragging {
  /* border: 1px solid var(--selected-color);
  margin: 0px; */
  box-shadow: 0px 0px 0px 1px var(--selected-color) inset;
}
.quantum-block:focus-within {
  /* border: 1px dashed var(--selected-color); */
  /* margin: -1px; */
  box-shadow: 0px 0px 0px 1px var(--selected-color) inset;
}
.quantum-block.selected {
  /* border: 1px solid var(--selected-color); */
  /* margin: 0px; */
  box-shadow: 0px 0px 0px 1px var(--selected-color) inset;
  background: var(--selected-background-color);
}

.quantum-document .input-element {
  transform: scale(0);
  resize: none;
  position: fixed;
  clip: rect(0 0 0 0);
  width: 0px;
  height: 0px;
}

.grid-crosshair {
  position: absolute;
  user-select: none;
  transform: translate(-50%, -50%);
  padding: 1px;
  font-family: Arial, Helvetica, sans-serif;
}

.page-divider {
  position: absolute;
  top: 21cm;
  width: 100%;
  height: 1px;
  border-style: dashed;
  border-color: rgb(173, 173, 173);
  border-width: 0.5px;
}

.page-number,
.next-page-number {
  position: absolute;
  right: -10px;
  transform: translateX(100%);
  color: rgb(90, 110, 129);
  user-select: none;
}

.page-number {
  bottom: 4px;
}

.next-page-number {
  top: 4px;
}
</style>

<style>
.moveable-line {
  /* all: none !important; */
  all: initial !important;
  /* cursor: move; */
  /* position: absolute; */
  /* width: 0.5px; */
  /* height: 0.5px; */
  /* background: rgba(57, 131, 180, 0.459) !important; */
  /* background: rgba(180, 57, 98, 0.459) !important; */
  /* transform-origin: 0px 0.5px; */
}
</style>
