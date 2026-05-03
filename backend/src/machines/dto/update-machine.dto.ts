import { CreateMachineDto } from "./create-machine.dto";
import { PartialType } from "@nestjs/swagger";

export class UpdateMachineDto extends PartialType(CreateMachineDto) {

}