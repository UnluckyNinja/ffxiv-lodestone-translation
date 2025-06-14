<script setup lang="ts">
import { useOptions } from '../misc/store';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

const {
  enableGoogleTranslate,
  translateMode,
  customTranslations,
  matchSelectors,
  katakanaLanguage,
  sourceLanguage,
  datasetType,
  resetOptions: _resetOptions,
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

function updateMode(value: boolean){
  if(value) {
    translateMode.value = 'full'
  } else {
    translateMode.value = 'katakana'
  }
}

const firstClickReset = ref(false)
const resetButton = useTemplateRef('resetButton')
onClickOutside(resetButton, ()=>{
  firstClickReset.value = false
})

function resetOptions(){
  if (!firstClickReset.value) {
    firstClickReset.value = true
    return
  }
  _resetOptions()
  firstClickReset.value = false
}

</script>

<template>
  <Card class="dark bg-slate-9 min-w-md abc">
    <CardHeader class="text-center">
      <CardTitle class="text-center">
        设置
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-xs">
      <div class="text-center text-red-300">修改完毕后请手动刷新页面</div>
      <!-- simple options -->
      <div class="flex items-center">
        <div class="flex-auto">
          原始语言
        </div>
        <div class="flex justify-end">
          <Tabs :default-value="sourceLanguage">
            <TabsList class="grid grid-cols-2">
              <TabsTrigger @click="sourceLanguage = 'jp'" class="data-[state=active]:bg-primary" value="jp">
                日文
              </TabsTrigger>
              <TabsTrigger @click="sourceLanguage = 'en'" class="data-[state=active]:bg-primary" value="en">
                英文
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div class="flex items-center">
        <div class="flex-auto">
          词汇数据源类型
        </div>
        <div class="flex justify-end">
          <Tabs :default-value="datasetType">
            <TabsList class="grid grid-cols-2">
              <TabsTrigger @click="datasetType = 'itemonly'" class="data-[state=active]:bg-primary" value="itemonly">
                仅物品
              </TabsTrigger>
              <TabsTrigger @click="datasetType = 'full'" class="data-[state=active]:bg-primary" value="full">
                全部
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div class="flex">
        <div class="flex-auto">
          全文替换翻译（仅日译中）
        </div>
        <div class="flex justify-end">
          <Switch :checked="translateMode === 'full'" @update:checked="updateMode" />
        </div>
      </div>
      <div class="flex">
        <div class="flex-auto">
          启用片假名谷歌翻译
        </div>
        <div class="flex justify-end">
          <Switch :disabled="translateMode === 'full'" v-model:checked="enableGoogleTranslate" />
        </div>
      </div>
      <div class="flex items-center">
        <div class="flex-auto">
          片假名翻译目标语言
        </div>
        <div class="flex justify-end">
          <Tabs :default-value="katakanaLanguage">
            <TabsList class="grid grid-cols-2">
              <TabsTrigger :disabled="translateMode === 'full'" @click="katakanaLanguage = 'zh-CN'" class="data-[state=active]:bg-primary" value="zh-CN">
                中文
              </TabsTrigger>
              <TabsTrigger :disabled="translateMode === 'full'" @click="katakanaLanguage = 'en'" class="data-[state=active]:bg-primary" value="en">
                英文
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <!-- <Button @click="katakanaLanguage = 'zh-cn'" >中文</Button>
        <Button @click="katakanaLanguage = 'en'" :class="{'text-gray bg-gray': katakanaLanguage === 'zh-cn'}">英文</Button> -->
        </div>
      </div>
      <hr class="border-gray border-solid border-t bg-none">
      <!-- customTranslations -->
      <div>
        <div class="">手动指定翻译</div>
        <div class="grid grid-cols-7 place-items-stretch p-2 m-2 bg-secondary overflow-y-auto max-h-30">
          <div v-if="Object.keys(customTranslations).length === 0" class="col-span-7 flex place-content-center">
            &lt;空&gt;
          </div>
          <template v-else>
            <template v-for="[k, v] in Object.entries(customTranslations)" class="grid-cols-2">
              <div class="col-span-3 flex place-content-center">{{ k }}</div>
              <div class="col-span-3 flex place-content-center border-l-2 border-solid border-truegray-4">{{ v }}</div>
              <div class="col-span-1 flex place-content-center">
                <div class="m-auto text-red cursor-pointer text-lg i-carbon-trash-can" @click="removeTranslation(k)">
                </div>
              </div>
            </template>
          </template>
        </div>
        <div class="flex w-full place-items-center gap-4">
          <Input type="text" placeholder="原文" v-model="matchFrom" class="" />
          <Input type="text" placeholder="标注为" v-model="matchTo" class="" />
          <Button :variant="customTranslations[matchFrom] ? 'destructive' : 'default'" class="text-foreground" @click="addTranslation">
            <div v-if="customTranslations[matchFrom]">覆盖</div>
            <div v-else class="i-carbon-add text-xl"></div>
          </Button>
        </div>
      </div>
      <hr class="border-gray border-solid border-t bg-none">
      <!-- matchSelectors -->
      <div>
        <div class="">指定页面元素</div>
        <div class="flex flex-col gap-1 p-2 m-2 bg-secondary overflow-y-auto max-h-30">
          <div v-if="matchSelectors.length === 0" class="flex place-content-center">
            &lt;空&gt;
          </div>
          <template v-else>
            <div v-for="selector, idx in matchSelectors" class="flex items-center">
              <div class="flex-1">{{ selector }}</div>
              <div class="flex-none text-red cursor-pointer text-lg i-carbon-trash-can" @click="removeSelector(idx)">
              </div>
            </div>
          </template>
        </div>
        <div class="flex items-center justify-center gap-4">
          <Input type="text" placeholder="CSS选择器" v-model="newSelector" />
          <Button variant="default" class="text-foreground"  @click="addSelector">
            <div class="i-carbon-add text-xl"></div>
          </Button>
        </div>
      </div>
      <hr class="border-gray border-solid border-t bg-none">
      <div class="text-center">
        <Button ref="resetButton" variant="destructive" class="text-foreground"  @click="resetOptions">
          {{ firstClickReset ? '确定重置？' :'重置全部选项'}}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

<style>
</style>
