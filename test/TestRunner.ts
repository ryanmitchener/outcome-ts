export type TestGroup<T> = {
    context: T
    tests: { [testName: string]: Test<T> }
    label?: string
    beforeEach?: (context: T) => void
    afterEach?: (context: T) => void
    beforeAll?: (context: T) => void
    afterAll?: (context: T) => void
}

export type Test<T> = (context: T) => Promise<any>

export class TestRunner {
    static async run<T>(...testGroups: TestGroup<T>[]) {
        let totalTestCount: number = 0
        let totalPassedCount: number = 0

        for (let i = 0; i < testGroups.length; i++) {
            const group: TestGroup<T> = testGroups[i]
            const singleTests: string[] = Object.getOwnPropertyNames(group.tests).filter(testName => {
                return testName.indexOf("_") === 0
            })
            const testNames: string[] = singleTests.length > 0 ? singleTests : Object.getOwnPropertyNames(group.tests)
            const context = group.context
            let passedCount: number = 0
            totalTestCount += testNames.length

            console.group(`Running Group (${i + 1} of ${testGroups.length})${group.label ? ": " + group.label : ""}`)
            group.beforeAll?.(context)

            for (let j = 0; j < testNames.length; j++) {
                group.beforeEach?.(context)
                const testName = testNames[j]
                const test = group.tests[testName]

                try {
                    console.groupCollapsed(`Running Test (${j + 1} of ${testNames.length}): ${testName}`)
                    await test(context)
                    passedCount++
                    totalPassedCount++
                    console.groupEnd()
                    console.log(fmt(`\u2713 Passed:  ${testName}`, Text.green))
                } catch (e) {
                    console.groupEnd()
                    console.groupCollapsed(fmt(`\u2717 Failed:  ${testName}`, Text.red))
                    console.log(e)
                    console.groupEnd()
                }
                group.afterEach?.(context)
            }

            group.afterAll?.(context)
            console.groupEnd()
            console.log(
                fmt(
                    `Finished tests: ${passedCount} of ${testNames.length} passed`,
                    passedCount === testNames.length ? Text.green : Text.red
                )
            )
        }

        console.log(
            fmt(
                `\nFinished all test groups: ${totalPassedCount} of ${totalTestCount} passed`,
                totalPassedCount === totalTestCount ? Text.green : Text.red,
                Text.bold,
                Text.inverse
            )
        )
    }
}

export function assert(condition: boolean): boolean {
    if (!condition) {
        throw "Test failed"
    }
    return condition
}

enum Text {
    green = `\x1b[32m`,
    red = `\x1b[31m`,
    bold = `\x1b[1m`,
    underline = `\x1b[4m`,
    inverse = `\x1b[7m`
}

function fmt(message: string, ...formatters: Text[]): string {
    return `${formatters.join("")}${message}\x1b[0m`
}
