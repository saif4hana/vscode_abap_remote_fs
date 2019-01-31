import { ADTClient } from "abap-adt-api"
import { window } from "vscode"
import { AbapObject } from "../abap/AbapObject"
import { isAdtException } from "../AdtExceptions"

export class AdtObjectActivator {
  constructor(private client: ADTClient) {}
  async selectMain(obj: AbapObject): Promise<string> {
    const mainPrograms = await obj.getMainPrograms(this.client)
    if (mainPrograms.length === 1) return mainPrograms[0]["adtcore:uri"]
    const mainProg = await window.showQuickPick(
      mainPrograms.map(p => p["adtcore:name"]),
      {
        placeHolder: "Please select a main program"
      }
    )
    if (mainProg)
      return mainPrograms.find(x => x["adtcore:name"] === mainProg)![
        "adtcore:uri"
      ]
    return ""
  }

  async activate(object: AbapObject) {
    //TODO: handle multiple inactive components
    const inactive = object.getActivationSubject()
    try {
      return await this.client.activate(inactive.name, inactive.path)
    } catch (e) {
      if (isAdtException(e) && e.type === "invalidMainProgram") {
        const mainProg = await this.selectMain(inactive)
        if (mainProg)
          return this.client.activate(inactive.name, inactive.path, mainProg)
      } else throw e
    }
  }
}