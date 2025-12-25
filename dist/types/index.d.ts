import EventEmitter from 'eventemitter3';

interface IResult<T> {
    data?: T;
    code?: number;
    msg?: string;
}
/**
 * 播放器标准接口
 */
interface PlayerInterface extends EventEmitter {
    playing: boolean;
    volume: number;
    playbackRate: number;
    deviceCapacity: Record<string, any>;
    i18n: any;
    logger: any;
    /**
     * 播放
     * @param options
     * @returns {Promise}
     */
    play: (options?: any) => Promise<unknown>;
    /**
     * 暂停播放
     * @returns
     */
    pause: (bool?: boolean) => Promise<unknown>;
    /**
     * 销毁并断流
     * @returns
     */
    destroy: () => Promise<unknown>;
    /**
     * 截图
     * @param {string} name 文件名 默认时间戳（new Date().getTime()）
     * @param {"png" | "jpeg"} fmt 图片格式
     * @param {"base64"} type 文件格式 默认base64
     * @param {boolean} download 是否直接下载 默认不直接下载
     * @returns 返回base64字符
     */
    snapshot: (name?: string, fmt?: 'jpeg', type?: 'base64', download?: boolean) => Promise<IResult<{
        fileName?: string;
        base64?: string;
    } | null>>;
    /**
     * 开始录制视频
     * @param {string} name 文件名 默认时间戳（new Date().getTime()）
     * @param {"mp4"} fmt 图片格式 默认mp4
     * @returns
     */
    startRecord?: (name?: string, fmt?: 'mp4') => Promise<any>;
    /**
     * 停止录制
     * @returns
     */
    stopRecord?: () => Promise<any>;
    /**
     * 全屏
     * @returns
     */
    fullScreen: () => Promise<void>;
    /**
     * 退出全屏
     * @returns
     */
    exitScreen: () => Promise<void>;
    /**
     * 设置画布/视频的尺寸  不设置 默认使用容器的高宽（充满容器）
     * @param {number=} width 画布的宽度
     * @param {number=} height 画布的高度
     * @returns
     */
    resize: (width?: number, height?: number) => Promise<{
        width: number;
        height: number;
    }>;
    /**
     * 设置音量
     * @param volume 音量 [0-1]， 0：表示静音
     * @returns {void}
     */
    setVolume: (volume: number) => void;
    /**
     * 设置封面
     * @param url
     * @returns
     */
    setPoster?: (postUrl: string) => void;
    /**
     * 设置播放速度
     * @param rate
     * @returns
     */
    setPlaybackRate?: (rate: number) => void;
    /**
     * 当前版本号
     * @returns
     */
    getVersion: () => object;
    /**
     * 设置日志打印的级别 INFO | LOG | WARN | ERROR
     *
     *
     * @param {string} level 日志级别 一次从大到小 3 -> 0 (为了更好的扩展)
     * @returns
     */
    setDebug?: (level: 'INFO' | 'LOG' | 'WARN' | 'ERROR') => void;
}

interface PlayerPlugin {
    name: string;
    init?: (player?: PlayerInterface) => void;
    beforeExec?: (player?: PlayerInterface) => boolean | Promise<boolean>;
    exec: (player?: PlayerInterface) => void;
    afterExec?: (player?: PlayerInterface) => void;
    destroy?: (player?: PlayerInterface) => void;
}

/**
 * 录制配置项
 */
interface RecordOptions {
    /**
     * 是否下载录制文件
     * @default true
     */
    downloadRecord?: boolean;
}
/**
 * 录制停止回调
 * @param url 录制文件地址
 * @param file 录制文件
 */
type RecordStopCallBackType = (url: string, file: Blob) => void;
/**
 * 录制支持 PS 流和 FLV 流
 * @example
 * ```ts
 *   // 初始化录制
 *   const record = new Record({downloadRecord: true})
 *   record.startRecord([73, 77, 75, 72, ...]) // 开始录制
 *   record.stopRecord()  // 停止录制
 *   record.destroy()  // 销毁
 * ```
 */
declare class Record$1 {
    szStorageUUID: string | null;
    private _oStorageManager;
    downloadRecord: boolean;
    /**
     * 录制支持 PS 流和 FLV 流
     * @param options - 配置项
     */
    constructor(options: RecordOptions);
    /**
     * @param type 码流类型
     * @param videoCodec 视频编码类型 （"h264" | "h265"）
     * @param audioCodec  音频编码类型
     * @param audioSimpleRate  音频采样率
     */
    static getHKHead(type: 'flv' | 'ps' | 'rtp' | 'ts', videoCodec: 'h264' | 'h265', audioCodec: 'aac' | 'g711_a' | 'g711_u' | 'g722', audioSimpleRate: '8000' | '16000' | '32000' | '44100' | '48000'): Uint8Array;
    /**
     * 开始录像
     * @param aHead 视频流头数据 40位 (必须是海康的流头)
     * @param name 文件名
     * @param stopCallBack 录制结束回调
     * @param secretKey 码流验证码（仅加密流需要）
     * @returns {Promise<string>}
     */
    startRecord(aHead: Uint8Array, name?: string, stopCallBack?: RecordStopCallBackType, secretKey?: string): Promise<unknown>;
    /**
     * 往录像存储中输入数据
     * @param buff 视频数据
     */
    inputData(buff: Uint8Array): void;
    /**
     * 停止录像， 并根据 downloadRecord 的值进行判断是否下载文件
     * @returns {Promise<string>}
     */
    stopRecord(): Promise<unknown>;
    /**
     * 销毁
     * @returns {void}
     */
    destroy(): void;
}

/**
 * 插件录制
 */
interface PlayerPluginRecordProps {
    /**
     * 是否下载录制文件
     * @default true
     */
    downloadRecord?: boolean;
}
/**
 * ezopne 录制视频
 * @example
 * ```ts
 * import EZopenPlayer from '@ezuikit/player-ezopen';
 * import { PlayerPluginRecord } from '@ezuikit/player-plugin-record';
 * // 播放地址 url 和 accessToken 从下面地址获取
 * // https://open.ys7.com/console/device.html
 * const player = new EZopenPlayer({
 *  id: "app",
 *  url: "ezopne player url",
 *  accessToken: "accessToken"
 * })
 * const recordPlugin = new PlayerPluginRecord(); // 录制插件
 * player.use(recordPlugin)
 * recordPlugin.startRecord()
 * ```
 */
declare class PlayerPluginRecord implements PlayerPlugin {
    _player: PlayerInterface;
    readonly name: string;
    /** 录制对象 */
    private _record;
    /** 录制中 */
    recording: boolean;
    constructor(props?: PlayerPluginRecordProps);
    /**
     * 执行插件
     * @param {PlayerInterface} player 播放器
     */
    exec(player: PlayerInterface): void;
    /**
     * 开始录制
     * @param {string} fileName 视频文件名
     * @param {number=} port
     * @returns {Promise<string>}
     */
    startRecord(fileName?: string, stopCallBack?: RecordStopCallBackType, secretKey?: string): Promise<void>;
    /**
     * 停止录制
     * @returns {Promise<string>}
     */
    stopRecord(): Promise<unknown>;
    /**
     * 销毁
     */
    destroy(): void;
    /**
     * 输入录制数据
     * @param data
     */
    private _recordInputDataFn;
}

export { PlayerPluginRecord, type PlayerPluginRecordProps, Record$1 as Record };
