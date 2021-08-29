<template>
  <header class="header">
    <n-grid :x-gap="12" :cols="2" :style="{ height: '36px' }">
      <n-gi>
        <n-space :style="{ marginTop: '0px', paddingTop: '0px', height: '36px' }" :size="0">
          <div :style="{ width: '16px', height: '30px' }" />
          <!-- <h3 @click="() => {}" :style="{ cursor: 'pointer', margin: 0, width: '110px', height: '36px' }">QuantumSheet</h3> -->
          <n-gradient-text type="info" :size="22" :style="{ cursor: 'pointer' }"> QuantumSheet </n-gradient-text>
          <div :style="{ width: '16px' }" />
          <n-dropdown
            placement="bottom-start"
            trigger="click"
            :animated="true"
            @select="handleSelect"
            :options="[
              {
                label: 'New',
                key: () => UI.fileInterface.promptNewFile(),
              },
              {
                label: 'Open',
                key: () => UI.fileInterface.openFileOpenModal(),
              },
              {
                label: 'Save',
                key: () => UI.fileInterface.openFileSaveModal(),
              },
            ]"
          >
            <n-button :style="{ height: '36px', '--border': 'none', '--border-radius': '0px', '--ripple-color': 'rgba(0,0,0,0)' }"> File </n-button>
          </n-dropdown>
          <n-dropdown
            placement="bottom-start"
            trigger="click"
            :animated="true"
            @select="handleSelect"
            :options="[
              {
                label: 'Document Preferences',
                key: () => {
                  UI.fileInterface.documentPrefsModal.value = true
                },
              },
            ]"
          >
            <n-button :style="{ height: '36px', '--border': 'none', '--border-radius': '0px', '--ripple-color': 'rgba(0,0,0,0)' }"> Edit </n-button>
          </n-dropdown>
        </n-space>
      </n-gi>
      <n-gi>
        <n-space justify="end" size="large" align="center" :style="{ marginTop: '0px', padding: '0px', height: '36px' }">
          <p style="margin: 0px">v{{ pkg.version }} - <a href="https://github.com/stefnotch/quantum-sheet">View on GitHub</a></p>
          <div :style="{ width: '20px' }" />
        </n-space>
      </n-gi>
    </n-grid>
  </header>

  <teleport to="#modal">
    <!-- OPEN modal -->
    <n-modal
      v-model:show="UI.fileInterface.fileOpenModal.value"
      title="Open File"
      preset="dialog"
      content="Are you sure?"
      positive-text="Open"
      @positive-click="UI.fileInterface.confirmFileOpenModal()"
    >
      <n-input
        v-model:value="UI.fileInterface.serializedDocument.value"
        type="textarea"
        :autosize="{
          minRows: 8,
          maxRows: 20,
        }"
        :style="{ marginBottom: '20px' }"
      />
      <n-upload :on-before-upload="beforeUpload">
        <n-upload-dragger>
          <div style="margin-bottom: 12px">
            <n-icon size="48" :depth="3">
              <InboxOutlined />
            </n-icon>
          </div>
          <n-text style="font-size: 16px">Click or drag file to this area to upload</n-text>
          <br />
          <n-p depth="3" style="margin: 8px 0 0 0">Strictly prohibit from uploading sensitive information.</n-p>
        </n-upload-dragger>
      </n-upload>
    </n-modal>
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
      title="Document Preferences"
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
// import { InboxOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import pkg from '../../package.json'

import * as UI from './ui'
import { useDocumentManager } from '../model/document/document-manager'

import { NButton, NGrid, NGridItem, NGi, NSpace, NDropdown, NGradientText, NModal, NCard, NInput, NUpload, NUploadDragger, NIcon } from 'naive-ui'

// https://github.com/07akioni/xicons#installation
import { UploadOutlined, InboxOutlined } from '@vicons/antd'

export default defineComponent({
  components: {
    InboxOutlined,
    DownloadOutlined,
    NGrid,
    NGridItem,
    NGi,
    NSpace,
    NButton,
    NDropdown,
    NGradientText,
    NModal,
    NCard,
    NInput,
    NUpload,
    NUploadDragger,
    NIcon,
    UploadOutlined,
    InboxOutlined,
  },
  setup(props, context) {
    // const UI = useUI()
    const docManager = useDocumentManager()

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

    function handleSelect(key) {
      key()
    }

    return {
      UI,
      docManager,
      download,
      beforeUpload,
      pkg,
      handleSelect,
    }
  },
})
</script>

<style scoped>
.header {
  z-index: 1;
  width: 100%;
  height: 36px;
  box-shadow: 0px 0px 5px 0.1px #ccc;
  background: rgb(255, 255, 255);
  display: inline-block;
}
.ant-menu-horizontal {
  line-height: 36px !important;
}
</style>

<style>
/* Symmetric Menu Transition */
.v-binder-follower-content {
  transform-origin: top !important;
}
/* Disable Transition */
/* .n-dropdown-menu {
  --bezier-ease-in: none !important;
  --bezier-ease-out: none !important;
} */

.popover-transition-enter-active {
  transition: opacity 0.15s var(--bezier-ease-out), transform 0.15s var(--bezier-ease-out) !important;
}
.popover-transition-leave-active {
  transition: opacity 0.15s var(--bezier-ease-in), transform 0.15s var(--bezier-ease-in) !important;
}
.popover-transition-enter-to,
.popover-transition-leave-from {
  transform: scale(1) !important;
  opacity: 1 !important;
}

.popover-transition-enter-from,
.popover-transition-leave-to {
  transform: scale(1) !important;
  transform: translate(0px, -10px) !important;
  opacity: 0 !important;
}
</style>
