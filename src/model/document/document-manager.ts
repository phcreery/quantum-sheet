import { readonly, shallowReactive, shallowRef, ref, Ref, watch, unref, toRefs, Reactive, reactive, computed } from 'vue'
import type { UseQuantumDocument } from './document'
import { v4 as uuidv4 } from 'uuid'

interface DocumentList {
  [id: string]: {
    quantumDocument: UseQuantumDocument<any> | undefined
    serializedData: string | undefined
  }
}

const documents: Ref<DocumentList> = ref({})
const quantumDocument = shallowRef<UseQuantumDocument<any>[]>()
// const hasUnsavedChanges = ref(false)
const currentDocumentID: Ref<string> = ref('')

export function useDocumentManager() {
  function openDocument(serializedData?: string) {
    const id = uuidv4()
    console.log('making', id, documents)
    documents.value[id] = { quantumDocument: undefined, serializedData: serializedData }
    currentDocumentID.value = id
    return id
  }
  function registerQuantumDocument(newQuantumDocument: UseQuantumDocument<any>, id: string) {
    // TODO: Verify document integrity
    // quantumDocument.value = newQuantumDocument\
    console.log('IDs', Object.keys(documents.value))
    console.log('registering', id)
    documents.value[id].quantumDocument = newQuantumDocument
  }

  function loadDocument(serializedData: string) {
    let documentObject = JSON.parse(serializedData)
    // TODO: Reset document/create new document
    quantumDocument.value?.[0].deserializeDocument(documentObject)
  }
  function saveDocument() {
    let serializedData = JSON.stringify(quantumDocument.value?.[0].serializeDocument())
    return serializedData
  }

  const IDs = computed(() => Object.keys(documents.value))
  const currentDocument = computed(() => documents.value[currentDocumentID.value]?.quantumDocument)

  return {
    IDs,
    currentDocumentID,
    openDocument,
    registerQuantumDocument,
    loadDocument,
    saveDocument,
    currentDocument,
  }
}
