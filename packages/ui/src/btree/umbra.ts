class ColumnStore {
    columns: Map<string, Map<number, any[]>>;
    versions: Map<number, number>;
    currentVersion: number;

    constructor() {
        this.columns = new Map<string, Map<number, any[]>>();
        this.versions = new Map<number, number>();
        this.currentVersion = 0;
        this.versions.set(this.currentVersion, 0);
    }

    private getColumn(columnName: string): Map<number, any[]> {
        let column = this.columns.get(columnName);
        if (!column) {
            column = new Map<number, any[]>();
            this.columns.set(columnName, column);
        }
        return column;
    }

    private getVersion(version: number): number {
        let ver = this.versions.get(version);
        if (!ver) {
            ver = 0;
            this.versions.set(version, ver);
        }
        return ver;
    }

    private createNewVersion(): number {
        const newVersion = this.currentVersion + 1;
        this.currentVersion = newVersion;
        this.versions.set(newVersion, 0);
        return newVersion;
    }

    private incrementVersion(version: number): void {
        const ver = this.versions.get(version);
        if (ver !== undefined) {
            this.versions.set(version, ver + 1);
        }
    }

    insert(columnName: string, value: any): void {
        const column = this.getColumn(columnName);
        const newVersion = this.createNewVersion();

        for (const [version, entries] of column) {
            if (version <= this.currentVersion) {
                entries.push(value);
            } else {
                const clonedValue = JSON.parse(JSON.stringify(value));
                entries.push(clonedValue);
            }
            this.incrementVersion(version);
        }

        column.set(newVersion, [value]);
    }

    bulkInsert(columnName: string, values: any[]): void {
        const column = this.getColumn(columnName);
        const newVersion = this.createNewVersion();

        for (const [version, entries] of column) {
            if (version <= this.currentVersion) {
                entries.push(...values);
            } else {
                const clonedValues = values.map((value) => JSON.parse(JSON.stringify(value)));
                entries.push(...clonedValues);
            }
            this.incrementVersion(version);
        }

        column.set(newVersion, values.slice());
    }

    delete(columnName: string, version: number): void {
        const column = this.getColumn(columnName);
        const ver = this.getVersion(version);
        const entries = column.get(ver);

        if (entries) {
            entries.pop();
            this.incrementVersion(ver);
        }
    }

    bulkDelete(columnName: string, version: number, count: number): void {
        const column = this.getColumn(columnName);
        const ver = this.getVersion(version);
        const entries = column.get(ver);

        if (entries) {
            entries.splice(-count);
            this.incrementVersion(ver);
        }
    }

    get(columnName: string, version: number): any[] {
        const column = this.getColumn(columnName);
        const ver = this.getVersion(version);
        return column.get(ver) || [];
    }
}
