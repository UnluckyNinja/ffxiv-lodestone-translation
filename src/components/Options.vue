<script setup lang="ts">
import { useOptions } from '../misc/store';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

const {
  enableGoogleTranslate,
  customTranslations,
  matchSelectors,
  katakanaLanguage,
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
  <Card class="dark bg-slate-9 min-w-md abc">
    <CardHeader class="text-center">
      <CardTitle class="text-center">
        设置
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-xs">
      <!-- simple options -->
      <div class="flex">
        <div class="flex-auto">
          启用片假名谷歌翻译
        </div>
        <div class="flex justify-end">
          <Switch v-model:checked="enableGoogleTranslate" />
        </div>
      </div>
      <div class="flex items-center">
        <div class="flex-auto">
          谷歌翻译目标语言
        </div>
        <div class="flex justify-end">
          <Tabs :default-value="katakanaLanguage">
            <TabsList class="grid grid-cols-2">
              <TabsTrigger @click="katakanaLanguage = 'zh-CN'" class="data-[state=active]:bg-primary" value="zh-cn">
                中文
              </TabsTrigger>
              <TabsTrigger @click="katakanaLanguage = 'en'" class="data-[state=active]:bg-primary" value="en">
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
    </CardContent>
  </Card>
</template>

<style>
</style>
