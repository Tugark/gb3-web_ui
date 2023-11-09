import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'mapRotation',
})
export class MapRotationPipe implements PipeTransform {
  transform(rotation: number): string {
    return `rotate(${rotation - 45}deg)`;
  }
}
