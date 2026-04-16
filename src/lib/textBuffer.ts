/**
 * テキストとカーソル位置を管理するバッファ。
 * イミュータブルで操作するたびに新しいインスタンスを返す。
 */
export class TextBuffer {
  readonly text: string;
  readonly cursor: number;

  constructor(text: string = '', cursor: number = 0) {
    this.text = text;
    this.cursor = Math.max(0, Math.min(cursor, text.length));
  }

  /** カーソル位置に文字を挿入 */
  insert(ch: string): TextBuffer {
    const next = this.text.slice(0, this.cursor) + ch + this.text.slice(this.cursor);
    return new TextBuffer(next, this.cursor + ch.length);
  }

  /** カーソル直前の文字を削除 */
  backspace(): TextBuffer {
    if (this.cursor === 0) return this;
    const next = this.text.slice(0, this.cursor - 1) + this.text.slice(this.cursor);
    return new TextBuffer(next, this.cursor - 1);
  }

  /** カーソル直前の文字を変換（濁点・半濁点・小文字トグル用） */
  transformPrev(map: Record<string, string>): TextBuffer {
    if (this.cursor === 0) return this;
    const prev = this.text[this.cursor - 1];
    const next = map[prev];
    if (!next) return this;
    return new TextBuffer(
      this.text.slice(0, this.cursor - 1) + next + this.text.slice(this.cursor),
      this.cursor
    );
  }

  /** カーソルを左へ */
  moveLeft(): TextBuffer {
    return new TextBuffer(this.text, this.cursor - 1);
  }

  /** カーソルを右へ */
  moveRight(): TextBuffer {
    return new TextBuffer(this.text, this.cursor + 1);
  }

  /** クリア */
  static empty(): TextBuffer {
    return new TextBuffer();
  }
}
