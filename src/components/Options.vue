<script setup lang="ts">
import { useOptions } from '../store';


const {
  enableGoogleTranslate,
  customTranslations,
  matchSelectors
} = useOptions()

const matchFrom = ref('')
const matchTo = ref('')

function addTranslation() {
  if (!matchFrom.value || !matchTo.value) return
  customTranslations.value[matchFrom.value] = matchTo.value
  matchFrom.value = ''
  matchTo.value = ''
}
function removeTranslation(k: string) {
  delete customTranslations.value[k]
}

const newSelector = ref('')
function addSelector() {
  if (!newSelector.value) return
  matchSelectors.value.push(newSelector.value)
  newSelector.value = ''
}
function removeSelector(k: number) {
  matchSelectors.value.splice(k)
}

</script>

<template>
  <div class="m-2 min-w-md">
    <div class="text-2xl flex place-content-center relative">设置</div>
    <!-- enableGoogleTranslate -->
    <div class="w-max">
      <input type="checkbox" v-model="enableGoogleTranslate">
      <span>
        启用片假名谷歌翻译
      </span>
    </div>
    <hr class="border-gray border-solid border-t bg-none">
    <!-- customTranslations -->
    <div>
      <div class="">手动指定翻译</div>
      <div class="grid grid-cols-7 place-items-stretch p-2 m-2 bg-truegray-6 overflow-y-auto max-h-30">
        <div v-if="Object.keys(customTranslations).length === 0" class="col-span-7 flex place-content-center">
          < 空 >
        </div>
        <template v-else>
          <template v-for="[k,v] in Object.entries(customTranslations)" class="grid-cols-2">
            <div class="col-span-3 flex place-content-center">{{ k }}</div>
            <div class="col-span-3 flex place-content-center border-l-2 border-solid border-truegray-4">{{ v }}</div>
            <div class="col-span-1 flex place-content-center">
              <div class="m-auto text-red cursor-pointer text-lg i-carbon-trash-can" @click="removeTranslation(k)"></div>
            </div>
          </template>
        </template>
      </div>
      <div class="grid grid-cols-7 w-full place-items-center">
        <div class="col-span-1 ml-2">
          原文
        </div>
        <div class="col-span-2">
          <input type="text" v-model="matchFrom" class="max-w-30">
        </div>
        <div class="col-span-1 ml-2">
          标注为
        </div>
        <div class="col-span-2">
          <input type="text" v-model="matchTo" class="max-w-30">
        </div>
        <div class="col-span-1 flex items-center p-2 rounded cursor-pointer text-white"
          :class="[customTranslations[matchFrom]? 'bg-red': 'bg-blue']"
          @click="addTranslation">
          <div v-if="customTranslations[matchFrom]">覆盖</div>
          <div v-else class="i-carbon-add text-xl"></div>
        </div>
      </div>
    </div>
    <hr class="border-gray border-solid border-t bg-none">
    <!-- matchSelectors -->
    <div>
      <div class="">指定页面元素</div>
      <div class="flex flex-col gap-1 p-2 m-2 bg-truegray-6 overflow-y-auto max-h-30">
        <div v-if="matchSelectors.length === 0" class="flex place-content-center">
          < 空 >
        </div>
        <template v-else>
          <div v-for="selector, idx in matchSelectors" class="flex items-center">
            <div class="flex-1">{{ selector }}</div>
            <div class="flex-none text-red cursor-pointer text-lg i-carbon-trash-can" @click="removeSelector(idx)"></div>
          </div>
        </template>
      </div>
      <div class="flex items-center justify-center gap-4">
        CSS选择器
        <input type="text" v-model="newSelector" class="max-w-30">
        <div class=" flex items-center p-2 rounded cursor-pointer text-white bg-blue"
        @click="addSelector">
          <div class="i-carbon-add text-xl"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
