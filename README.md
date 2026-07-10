# @ezuikit/player-plugin-record

> 萤石码流本地录制插件

基于萤石播放器（`@ezuikit/player-ezopen`）的码流本地录制插件，在浏览器端把实时/回放码流录制为可下载的 MP4 文件。支持「水印录制（硬解转码）」与「原始码流录制」两种模式，并可选采集原始码流用于问题排查。

## 功能特性

- 播放器(ezopen)插件化接入，通过 `player.use(plugin)` 一行注册。
- 两种录制模式自动切换：
  - **水印录制**：硬解（`decodeEngine === 1`）下经 WASM 编码器转码后录制，产物为 H264 + AAC，画面尺寸随视频动态调整，最大 `1920x1080`。
  - **原始码流录制**：软解或关闭水印录制时，直接写入原始分片，不做转码。
- 录制产物为 MP4，支持自动下载或交由回调自定义处理。
- 支持加密流录制（传入 `secretKey`）。
- 与播放器生命周期联动：`stop` / `pause` 自动停止录制，`destroy` 自动销毁。
- 可选的原始码流另存能力（`debugRecordRaw`），用于码流分析与问题定位。
- 底层录制类 `Record` 可独立使用，适配自定义码流接入场景。

## 安装

```bash
# npm
npm install @ezuikit/player-plugin-record

# pnpm
pnpm add @ezuikit/player-plugin-record

# yarn
yarn add @ezuikit/player-plugin-record
```

> 该插件需配合萤石播放器 `@ezuikit/player-ezopen` 使用。

## 快速开始

```js
import EZopenPlayer from "@ezuikit/player-ezopen";
import { PlayerPluginRecord } from "@ezuikit/player-plugin-record";

// 播放地址 url 和 accessToken 从萤石开放平台获取
// https://open.ys7.com/console/device.html
const player = new EZopenPlayer({
  id: "app",
  url: "ezopen player url",
  accessToken: "accessToken",
  width: 600,
  height: 400,
});

// 创建并注册录制插件
const recordPlugin = new PlayerPluginRecord();
player.use(recordPlugin);

// 开始录制
recordPlugin.startRecord("my-record");

// 停止录制（也会在播放器 stop/pause 时自动触发）
// recordPlugin.stopRecord();

// 销毁插件（也会在播放器 destroy 时自动触发）
// recordPlugin.destroy();
```

## API

### PlayerPluginRecord

录制插件主类，配合 `EZopenPlayer` 使用。

#### 构造参数 `PlayerPluginRecordProps`

| 参数                     | 类型      | 默认值  | 说明                                                                                                                                                  |
| ------------------------ | --------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `downloadRecord`         | `boolean` | `true`  | 停止录制时是否自动下载录制文件。                                                                                                                      |
| `staticPath`             | `string`  | `"."`   | 底层转码库 `libSystemTransformWASM.js` 的资源路径前缀，支持绝对地址与相对地址（内部会解析为绝对地址）。                                               |
| `enabledWatermarkRecord` | `boolean` | `true`  | 是否启用水印录制分支。`true` 时在硬解下经转码后录制（H264 + AAC，最大 `1920x1080`）；`false` 时走原始码流录制，不做转码。                             |
| `debugRecordRaw`         | `boolean` | `false` | 是否在录制过程中同步收集并下载原始码流，仅用于调试/码流分析，**请勿在生产环境开启**。仅在原始码流录制分支（`enabledWatermarkRecord = false`）下生效。 |

#### 实例属性

| 属性        | 类型      | 说明                                              |
| ----------- | --------- | ------------------------------------------------- |
| `name`      | `string`  | 插件名称，固定为 `ezuikit-player-plugin-record`。 |
| `recording` | `boolean` | 当前是否处于录制中。                              |

#### 实例方法

- **`startRecord(fileName?, stopCallBack?, secretKey?): Promise<string>`**
  - `fileName?: string` 录制文件名，默认使用当前时间戳。
  - `stopCallBack?: (url: string, file: Blob) => void` 录制结束回调，返回文件地址与文件对象。
  - `secretKey?: string` 码流验证码（仅加密流需要）。
  - 开始录制。若正在录制或缺少码流头则直接返回。

- **`stopRecord(): Promise<string | void>`**
  - 停止录制。根据 `downloadRecord` 决定是否下载文件。

- **`destroy(): void`**
  - 停止录制并销毁插件内部资源。

- **`exec(player): void`**
  - 插件注册入口，由 `player.use(plugin)` 内部调用，一般无需手动调用。

### Record

底层录制类，可脱离插件独立使用，适合自定义码流接入。

```ts
import { Record } from "@ezuikit/player-plugin-record";

const record = new Record({ downloadRecord: true });
record.startRecord(head /* 40 字节海康流头 */);
record.inputData(chunk); // 持续输入码流分片
record.stopRecord();
record.destroy();
```

#### 构造参数 `RecordOptions`

| 参数             | 类型      | 默认值 | 说明                                         |
| ---------------- | --------- | ------ | -------------------------------------------- |
| `downloadRecord` | `boolean` | `true` | 是否下载录制文件。                           |
| `staticPath`     | `string`  | `"."`  | 底层转码库资源路径前缀，需可解析为绝对地址。 |

#### 静态方法

- **`Record.getHKHead(type, videoCodec, audioCodec, audioSimpleRate): Uint8Array`**
  - 构造 40 字节海康码流头。
  - `type`: `"flv" | "ps" | "rtp" | "ts"`
  - `videoCodec`: `"h264" | "h265"`
  - `audioCodec`: `"aac" | "g711_a" | "g711_u" | "g722"`
  - `audioSimpleRate`: `"8000" | "16000" | "32000" | "44100" | "48000"`

#### 实例方法

| 方法                                                   | 说明                                                                    |
| ------------------------------------------------------ | ----------------------------------------------------------------------- |
| `startRecord(aHead, name?, stopCallBack?, secretKey?)` | 开始录像。`aHead` 必须为海康 40 字节流头；FLV 流仅支持 AAC + 16K 音频。 |
| `inputData(buff)`                                      | 往录像存储输入码流数据。                                                |
| `inputWatermarkData(rawData, info?)`                   | 输入水印（转码）码流数据。                                              |
| `stopRecord()`                                         | 停止录像，并按 `downloadRecord` 决定是否下载。                          |
| `destroy()`                                            | 销毁录制对象。                                                          |

## 录制模式说明

| 模式         | 触发条件                                                                      | 产物             | 说明                                                                             |
| ------------ | ----------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------- |
| 水印录制     | `enabledWatermarkRecord = true`（默认）且播放器为硬解（`decodeEngine === 1`） | H264 + AAC MP4   | 经 WASM 编码器转码，画面尺寸随视频动态调整，最大 `1920x1080`。可录制带水印画面。 |
| 原始码流录制 | 软解，或 `enabledWatermarkRecord = false`                                     | 原始码流封装 MP4 | 直接写入原始分片，不做转码。可配合 `debugRecordRaw` 另存原始码流。               |

## 注意事项

- 水印录制仅在**硬解**下可用；软解环境会自动回退为原始码流录制。
- 开启水印录制后，录制视频编码会转为 H264、音频转为 AAC，尺寸最大 `1920x1080`；部分浏览器可能出现音频转码失败，或录制文件仅有音频、无法渲染画面的情况。
- `debugRecordRaw` 仅用于调试，会额外产生 `.raw` 文件下载，请勿在生产环境开启。
- `staticPath` 用于加载底层转码库 `libSystemTransformWASM.js`；当浏览器 `new Blob` 加载失败时，将回退到该路径加载，务必保证其可访问。
- 插件会自动监听播放器 `stop` / `pause` 停止录制、`destroy` 销毁，无需重复处理。
