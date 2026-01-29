import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Materia, MateriaDocument } from './schemas/materia.schema';
import { CreateMateriaDto, UpdateMateriaDto } from './dto/materia.dto';

@Injectable()
export class MateriasService {
  constructor(
    @InjectModel(Materia.name) private materiaModel: Model<MateriaDocument>,
  ) {}

  async crear(createMateriaDto: CreateMateriaDto): Promise<MateriaDocument> {
    const existente = await this.materiaModel.findOne({
      nombre: { $regex: new RegExp(`^${createMateriaDto.nombre}$`, 'i') },
    });

    if (existente) {
      throw new ConflictException('Ya existe una materia con ese nombre');
    }

    const materia = new this.materiaModel(createMateriaDto);
    return materia.save();
  }

  async findAll(soloActivas = true): Promise<MateriaDocument[]> {
    const query = soloActivas ? { activa: true } : {};
    return this.materiaModel.find(query).sort({ nombre: 1 }).exec();
  }

  async findById(id: string): Promise<MateriaDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de materia inválido');
    }

    const materia = await this.materiaModel.findById(id).exec();

    if (!materia) {
      throw new NotFoundException('Materia no encontrada');
    }

    return materia;
  }

  async findByIds(ids: string[]): Promise<MateriaDocument[]> {
    const validIds = ids.filter(id => Types.ObjectId.isValid(id))
      .map(id => new Types.ObjectId(id));
    
    return this.materiaModel.find({ _id: { $in: validIds } }).exec();
  }

  async actualizar(id: string, updateDto: UpdateMateriaDto): Promise<MateriaDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de materia inválido');
    }

    if (updateDto.nombre) {
      const existente = await this.materiaModel.findOne({
        nombre: { $regex: new RegExp(`^${updateDto.nombre}$`, 'i') },
        _id: { $ne: id },
      });

      if (existente) {
        throw new ConflictException('Ya existe una materia con ese nombre');
      }
    }

    const materia = await this.materiaModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();

    if (!materia) {
      throw new NotFoundException('Materia no encontrada');
    }

    return materia;
  }

  async cambiarEstado(id: string, activa: boolean): Promise<MateriaDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de materia inválido');
    }

    const materia = await this.materiaModel
      .findByIdAndUpdate(id, { activa }, { new: true })
      .exec();

    if (!materia) {
      throw new NotFoundException('Materia no encontrada');
    }

    return materia;
  }

  async eliminar(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de materia inválido');
    }

    const resultado = await this.materiaModel.findByIdAndDelete(id).exec();

    if (!resultado) {
      throw new NotFoundException('Materia no encontrada');
    }
  }

  async contar(): Promise<number> {
    return this.materiaModel.countDocuments({ activa: true });
  }
}
