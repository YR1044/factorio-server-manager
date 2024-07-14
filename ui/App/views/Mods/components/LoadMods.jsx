import React, {useEffect, useState} from "react";
import savesResource from "../../../../api/resources/saves";
import Select from "../../../components/Select";
import Label from "../../../components/Label";
import {useForm} from "react-hook-form";
import Button from "../../../components/Button";
import modsResource from "../../../../api/resources/mods";
import modResource from "../../../../api/resources/mods";
import FactorioLogin from "./AddMod/components/FactorioLogin";
import ConfirmDialog from "../../../components/ConfirmDialog";

const LoadMods = ({refreshMods}) => {

    const [saves, setSaves] = useState([]);
    const {register, reset, handleSubmit} = useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [isDisabled, setIsDisabled] = useState(true);
    const [isFactorioAuthenticated, setIsFactorioAuthenticated] = useState(false);
    const [loadModsData, setLoadModsData] = useState(undefined);

    useEffect(() => {
        (async () => {
            setIsFactorioAuthenticated(await modResource.portal.status())

            const s = await savesResource.list()
            setSaves(s);
            if (s.length > 0) {
                setIsDisabled(false);
            }
            reset();
        })();
    }, []);

    const loadModsRequested = data => {
        setIsLoading(true);
        setLoadModsData(data);
    }

    const loadMods = async data => {
        await modResource.deleteAll();
        const {mods} = await savesResource.mods(data.save).catch(() => {
            setIsLoading(false);
            setLoadModsData(undefined);
        });

        await modResource.portal.installMultiple(mods)
            .then(() => {
                refreshMods();
                window.flash(`Mods are loaded from save file ${data.save}.`, "green");
            }).finally(() => {
                setIsLoading(false);
                setLoadModsData(undefined);
            });
    }

    return isFactorioAuthenticated
        ? <form onSubmit={handleSubmit(loadModsRequested)}>
            <Label text="Save" htmlFor="save"/>
            <Select
                register={register('save')}
                className="mb-4"
                disabled={isDisabled}
                options={saves?.map(save => new Object({
                    name: save.name,
                    value: save.name
                }))}
            />
            <Button isSubmit={true} isDisabled={isDisabled} isLoading={isLoading}>Load</Button>
            <ConfirmDialog
                title="Load Mods from Save"
                content={`Loading the Mods from Save "${loadModsData?.save}" will remove all currently installed Mods.`}
                isOpen={loadModsData !== undefined}
                close={() => {
                    setIsLoading(false);
                    setLoadModsData(undefined);
                }}
                onSuccess={() => loadMods(loadModsData)}
            />
        </form>
        : <FactorioLogin setIsFactorioAuthenticated={setIsFactorioAuthenticated}/>
}

export default LoadMods;
