<template>
  <header class="header">
    <a-row type="flex" justify="space-between" :style="{ height: '36px', lineHeight: '36px', paddingLeft: '20px' }">
      <a-col :span="8" :style="{ height: '36px' }">
        <a-space :style="{ height: '36px', alignItems: 'revert', gap: '0px' }" :size="0">
          <div :style="{ width: '10px' }" />
          <h3 @click="() => {}" :style="{ cursor: 'pointer', margin: 0, width: '110px' }">QuantumSheet</h3>
          <div :style="{ width: '16px' }" />
          <a-dropdown placement="bottomLeft" :trigger="['click']">
            <a-button ghost style="height: 36px; color: black">File</a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="UI.fileInterface.promptNewFile()"> New </a-menu-item>
                <a-menu-item @click="UI.fileInterface.openFileOpenModal()">Open... </a-menu-item>
                <a-menu-item @click="UI.fileInterface.openFileSaveModal()">Save as... </a-menu-item>
                <!-- <a-menu-item @click="UI.promptCloseFile()">Close</a-menu-item> -->
              </a-menu>
            </template>
          </a-dropdown>
          <a-dropdown placement="bottomLeft" :trigger="['click']">
            <a-button ghost style="height: 36px; color: black">Edit</a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="() => (UI.fileInterface.documentPrefsModal.value = true)"> Document Preferences </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          <a-dropdown placement="bottomLeft" :trigger="['click']">
            <a-button
              ghost
              style="height: 36px; color: black"
              v-on:mousedown="
                (ev) => {
                  ev.preventDefault()
                  ev.stopPropagation()
                }
              "
              >Σ</a-button
            >
            <template #overlay>
              <a-menu>
                <a-sub-menu
                  v-for="(section, index) in Object.keys(insertables.operators)"
                  :key="index"
                  :title="section"
                  v-on:mousedown="
                    (ev) => {
                      ev.preventDefault()
                      ev.stopPropagation()
                    }
                  "
                >
                  <a-menu-item
                    v-for="(op, index) in insertables.operators[section]"
                    :key="index"
                    :disabled="!op.enabled"
                    v-on:mousedown="
                      (ev) => {
                        op.action(docManager.currentDocument.value.focusedElementCommands.commands.value)
                        ev.preventDefault()
                        ev.stopPropagation()
                      }
                    "
                    >{{ op.name }} ({{ op.tip }})
                  </a-menu-item>
                </a-sub-menu>
                <a-menu-item @click="() => true" disabled> More Expressions... </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </a-space>
      </a-col>

      <a-col :style="{ height: '36px' }">
        <a-space :style="{ height: '36px' }">
          <p>v{{ pkg.version }} - <a href="https://github.com/stefnotch/quantum-sheet">View on GitHub</a></p>
          <div :style="{ width: '20px' }" />
        </a-space>
      </a-col>
    </a-row>
  </header>
  <teleport to="#modal">
    <!-- OPEN modal -->
    <a-modal v-model:visible="UI.fileInterface.fileOpenModal.value" title="Open File" ok-text="Open" @ok="UI.fileInterface.confirmFileOpenModal()">
      <a-textarea
        v-model:value="UI.fileInterface.serializedDocument.value"
        :auto-size="{ minRows: 8, maxRows: 20 }"
        :style="{ marginBottom: '20px' }"
      />
      <a-upload-dragger name="file" :multiple="false" :before-upload="beforeUpload">
        <p class="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p class="ant-upload-text">Click or drag file to this area to upload</p>
      </a-upload-dragger>
    </a-modal>
  </teleport>
  <teleport to="#modal">
    <!-- SAVE modal -->
    <a-modal v-model:visible="UI.fileInterface.fileSaveModal.value" title="Save File" ok-text="Done" @ok="UI.fileInterface.closeFileSaveModal()">
      <a-textarea
        v-model:value="UI.fileInterface.serializedDocument.value"
        :auto-size="{ minRows: 8, maxRows: 20 }"
        :style="{ marginBottom: '20px' }"
      />
      <a-button type="primary" size="large" block @click="download()">
        <template #icon>
          <DownloadOutlined />
        </template>
        Download
      </a-button>
    </a-modal>
  </teleport>
  <teleport to="#modal">
    <!-- Document Preferences Modal -->
    <a-modal
      v-if="docManager.currentDocument.value"
      v-model:visible="UI.fileInterface.documentPrefsModal.value"
      title="Document Prefereences"
      ok-text="Done"
      @ok="UI.fileInterface.closeDocPrefsModal()"
    >
      <a-form :label-col="{ span: 5 }" :wrapper-col="{ span: 12 }">
        <a-form-item label="Paper Style:">
          <div>
            <!-- Paper Style: -->
            <a-select
              v-model:value="docManager.currentDocument.value.options.paperStyle"
              @change="(value) => (docManager.currentDocument.value.options.paperStyle = value)"
            >
              <a-select-option value="standard">Standard</a-select-option>
              <a-select-option value="engineer">Engineering</a-select-option>
              <a-select-option value="printer">Printer</a-select-option>
            </a-select>
          </div>
        </a-form-item>
        <a-form-item label="Paper Size:">
          <div>
            <!-- Paper Size: -->
            <a-select
              v-model:value="docManager.currentDocument.value.options.paperSize"
              @change="(value) => (docManager.currentDocument.value.options.paperSize = value)"
            >
              <a-select-option value="A3">A3</a-select-option>
              <a-select-option value="A4">A4</a-select-option>
              <a-select-option value="A5">A5</a-select-option>
              <a-select-option value="ANSI_A">ANSI A (US Letter)</a-select-option>
              <a-select-option value="ANSI_B">ANSI B</a-select-option>
              <a-select-option value="ARCH_A">Arch A</a-select-option>
              <a-select-option value="ARCH_B">Arch B</a-select-option>
              <!-- <a-select-option value="Legal">Legal</a-select-option> -->
            </a-select>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, ref, inject, reactive } from 'vue'

import { useFocusedElementCommands, ElementCommands } from '../model/document/elements/element-commands'
import {
  Button,
  Grid,
  Row,
  Col,
  Space,
  Dropdown,
  Select,
  SelectOption,
  Form,
  FormItem,
  Modal,
  Menu,
  MenuItem,
  UploadDragger,
  Textarea,
  SubMenu,
} from 'ant-design-vue'
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import pkg from '../../package.json'

import * as UI from './ui'
import { useDocumentManager } from '../model/document/document-manager'

export default defineComponent({
  components: {
    InboxOutlined,
    DownloadOutlined,
    'a-row': Row,
    'a-col': Col,
    'a-grid': Grid,
    'a-space': Space,
    'a-dropdown': Dropdown,
    'a-select': Select,
    'a-select-option': SelectOption,
    'a-form': Form,
    'a-form-item': FormItem,
    'a-button': Button,
    'a-modal': Modal,
    'a-menu': Menu,
    'a-menu-item': MenuItem,
    'a-sub-menu': SubMenu,
    'a-upload-dragger': UploadDragger,
    'a-textarea': Textarea,
  },
  setup(props, context) {
    // const UI = useUI()
    const docManager = useDocumentManager()

    // TODO: place somewhere where within reach of documentation?
    const insertables = {
      operators: {
        Algebra: [
          {
            name: '+',
            tip: 'Addition',
            enabled: true,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('+'),
          },
          {
            name: '-',
            tip: 'Subtraction',
            enabled: true,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('-'),
          },
          {
            name: '⋅',
            tip: 'Multiplication',
            enabled: true,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('\\cdot'),
          },
          {
            name: '÷',
            tip: 'Division',
            enabled: true,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('\\div'),
          },
          {
            name: '⁄',
            tip: 'Fraction',
            enabled: true,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('\\frac'),
          },
          {
            name: 'x²',
            tip: 'Square',
            enabled: true,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('^2'),
          },
          {
            name: 'xⁿ',
            tip: 'Exponent',
            enabled: true,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('^'),
          },
          {
            name: '√',
            tip: 'Root',
            enabled: false,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('\\sqrt'),
          },
          {
            name: '%',
            tip: 'Percent',
            enabled: false,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('%'),
          },
          {
            name: '!',
            tip: 'Factorial',
            enabled: true,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('!'),
          },
        ],
        Trigonometry: [
          { name: 'sin', tip: 'Sine', enabled: true, action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('sin(') },
          {
            name: 'cos',
            tip: 'Cosine',
            enabled: true,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('cos('),
          },
          {
            name: 'tan',
            tip: 'Tangent',
            enabled: true,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('tan('),
          },
          {
            name: 'sec',
            tip: 'Secant',
            enabled: true,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('sec('),
          },
          {
            name: 'csc',
            tip: 'Cosecant',
            enabled: true,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('csc('),
          },
          {
            name: 'cot',
            tip: 'Cotangent',
            enabled: true,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('cot('),
          },
          {
            name: 'asin',
            tip: 'Arcsine',
            description: 'Inverse Sine function',
            enabled: false,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('asin('),
          },
          {
            name: 'acos',
            tip: 'Arccosine',
            description: 'Inverse Cosine function',
            enabled: false,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('acos('),
          },
          {
            name: 'atan',
            tip: 'Arctangent',
            description: 'Inverse Tangent function',
            enabled: false,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('atan('),
          },
          {
            name: 'asec',
            tip: 'Arcsecant',
            enabled: false,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('asec('),
          },
          {
            name: 'acsc',
            tip: 'Arccosecant',
            enabled: false,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('acsc('),
          },
          {
            name: 'acot',
            tip: 'Arccotangent',
            enabled: false,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('acot('),
          },
          {
            name: 'sinh',
            tip: 'Hyperbolic Sine',
            enabled: true,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('sinh('),
          },
          {
            name: 'cosh',
            tip: 'Hyperbolic Cosine',
            enabled: true,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('cosh('),
          },
          {
            name: 'tanh',
            tip: 'Hyperbolic Tangent',
            enabled: true,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('tanh('),
          },
          {
            name: 'sech',
            tip: 'Hyperbolic Secant',
            enabled: false,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('sech('),
          },
          {
            name: 'csch',
            tip: 'Hyperbolic Cosecant',
            enabled: false,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('csch('),
          },
          {
            name: 'coth',
            tip: 'Hyperbolic Cotangent',
            enabled: false,
            action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('coth('),
          },
        ],
        Calculus: [
          { name: 'd/dx', tip: 'Derivative', enabled: false, action: () => '' },
          { name: '∫dx', tip: 'Integral', enabled: false, action: () => '' },
        ],
        Evaluation: [
          { name: '=', tip: 'Evaluate', enabled: true, action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('=') },
          { name: '→', tip: 'Solve', enabled: false, action: (focusedElementCommands: ElementCommands) => focusedElementCommands?.insert?.('.') },
        ],
      },
    }

    function download(filename: string, text: string) {
      // defaults
      filename ? filename : (filename = 'quantum_document.qd')
      text ? text : (text = UI.fileInterface.serializedDocument.value)
      var element = document.createElement('a')
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
      element.setAttribute('download', filename)
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }

    function beforeUpload(file) {
      // let name = file.name
      // let path = file.path
      // let size = file.size
      const reader = new FileReader()
      reader.addEventListener('load', (event) => {
        let blob = event?.target?.result
        let data = (blob as string)?.split(',')
        let base64 = data[1]
        let string = atob(base64)
        UI.fileInterface.serializedDocument.value = string
      })
      reader.readAsDataURL(file)
      return false // to prevent antd fron trying to upload somewhere
    }

    return {
      UI,
      docManager,
      download,
      beforeUpload,
      pkg,
      insertables,
    }
  },
})
</script>

<style scoped>
.header {
  z-index: 1;
  width: 100%;
  box-shadow: 0px 0px 5px 0.1px #ccc;
  background: rgb(255, 255, 255);
}
.ant-menu-horizontal {
  line-height: 36px !important;
}
</style>
